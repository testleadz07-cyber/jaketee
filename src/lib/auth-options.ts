import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword } from '@/lib/auth'
import { isLoginLocked, recordFailedLogin, resetLoginAttempts } from '@/lib/rate-limit'

// Temporary in-memory bridge: signIn event → jwt callback
// Keyed by userId (string). Cleaned up after the jwt callback reads it.
const pendingSessionIds = new Map<string, string>()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please provide your email or username and password')
        }

        const identifier = credentials.identifier.trim().toLowerCase()

        const lockStatus = isLoginLocked(identifier)
        if (lockStatus.locked) {
          throw new Error('Too many failed login attempts. Please try again later.')
        }

        const db = await connectDB()
        if (db) {
          const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          })
          const isValid = user ? await comparePassword(credentials.password, user.password) : false
          if (!user || !isValid) {
            recordFailedLogin(identifier)
            throw new Error('Invalid email or username or password')
          }
          if (user.isActive === false) {
            throw new Error('This account has been disabled. Please contact support.')
          }
          resetLoginAttempts(identifier)
          return { id: String(user._id), email: user.email, name: user.name, username: user.username, role: user.role }
        }

        // Fallback: hardcoded admin (no DB)
        if (identifier === 'admin@jacketee.com' && credentials.password === 'admin123') {
          resetLoginAttempts(identifier)
          return { id: '1', email: 'admin@jacketee.com', name: 'Admin User', username: 'admin', role: 'admin' }
        }

        recordFailedLogin(identifier)
        throw new Error('Invalid email or username or password')
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = (user as any).id
        token.username = (user as any).username

        // Pick up the LoginSession id created in the signIn event
        const userId = (user as any).id as string
        if (userId && pendingSessionIds.has(userId)) {
          token.loginSessionId = pendingSessionIds.get(userId)
          pendingSessionIds.delete(userId)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.userId
        ;(session.user as any).loginSessionId = token.loginSessionId
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        const { connectDB } = await import('@/lib/mongodb')
        const Activity = (await import('@/models/Activity')).default
        const LoginSession = (await import('@/models/LoginSession')).default
        await connectDB()

        // Log activity (existing behaviour)
        await Activity.create({
          userId: user.id,
          action: 'login',
          details: { method: account?.provider || 'credentials' },
          ip: 'server-side',
          country: 'Unknown (Login Event)',
        })

        // Create a new LoginSession document
        const newSession = await LoginSession.create({
          userId: user.id,
          loginAt: new Date(),
          lastSeenAt: new Date(),
          ip: 'server-side',
          country: 'Unknown',
        })

        // Bridge the session id to the jwt callback via in-memory map
        pendingSessionIds.set(String(user.id), String(newSession._id))
      } catch (err) {
        console.error('Failed to log login event / create session:', err)
      }
    },

    async signOut({ token }) {
      try {
        const sessionId = (token as any)?.loginSessionId
        if (!sessionId) return
        const { connectDB } = await import('@/lib/mongodb')
        const LoginSession = (await import('@/models/LoginSession')).default
        await connectDB()

        const session = await LoginSession.findById(sessionId)
        if (session && !session.logoutAt) {
          session.logoutAt = new Date()
          const loginAt = session.loginAt instanceof Date ? session.loginAt : new Date(session.loginAt)
          session.durationSeconds = Math.round((session.logoutAt.getTime() - loginAt.getTime()) / 1000)
          await session.save()
        }
      } catch (err) {
        console.error('Failed to close login session on signOut:', err)
      }
    },
  },
}