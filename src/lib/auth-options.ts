import { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { resolveGoogleUser } from '@/lib/google-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { getActiveSessionUser } from '@/lib/session-user'
import { comparePassword } from '@/lib/auth'
import { isLoginLocked, recordFailedLogin, resetLoginAttempts } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { scheduleDailyAdminPushRetry } from '@/lib/notification-delivery'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { scope: 'openid email profile', prompt: 'select_account' } },
    })] : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        turnstileToken: { label: 'Security verification', type: 'text' },
      },
      async authorize(credentials) {
        if (typeof credentials?.identifier !== 'string' || !credentials.identifier.trim() || credentials.identifier.length > 254 ||
          typeof credentials?.password !== 'string' || !credentials.password || credentials.password.length > 1024) {
          throw new Error('Please provide your email or username and password')
        }

        const identifier = credentials.identifier.trim().toLowerCase()

        const lockStatus = isLoginLocked(identifier)
        if (lockStatus.locked) {
          throw new Error('Too many failed login attempts. Please try again later.')
        }

        if (!await verifyTurnstile(credentials.turnstileToken, 'login')) {
          throw new Error('Security verification failed. Please try again.')
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

        throw new Error('Sign-in is temporarily unavailable. Please try again later.')
      },
    }),
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true
      try {
        const existingSession = await getServerSession(authOptions)
        const dbUser = await resolveGoogleUser(profile as Parameters<typeof resolveGoogleUser>[0], (existingSession?.user as any)?.id)
        Object.assign(user, { id: String(dbUser._id), email: dbUser.email, name: dbUser.name, role: dbUser.role, username: dbUser.username })
        return true
      } catch (error) {
        const code = error instanceof Error && /^Google[A-Za-z]+$/.test(error.message) ? error.message : 'GoogleUnavailable'
        return `/login?error=${code}`
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role
        token.userId = user.id
        token.sub = user.id
        token.username = (user as any).username
        // Create the login session before encoding the JWT. NextAuth's signIn
        // event runs AFTER this callback, so an in-memory bridge cannot work.
        try {
          const LoginSession = (await import('@/models/LoginSession')).default
          const Activity = (await import('@/models/Activity')).default
          await connectDB()
          const login = await LoginSession.create({ userId: user.id, loginAt: new Date(), lastSeenAt: new Date() })
          token.loginSessionId = String(login._id)
          await Activity.create({ userId: user.id, action: 'login', details: { method: account?.provider || 'credentials' }, ip: 'server-side', country: 'Unknown (Login Event)' })
        } catch { console.error('Failed to record login session') }
        if (token.role === 'admin') scheduleDailyAdminPushRetry(user.id)
      }
      return token
    },
    async session({ session, token }) {
      try {
        const user = await getActiveSessionUser(token.userId, token.loginSessionId)
        if (!user) return null as unknown as typeof session
        session.user = {
          ...session.user,
          name: user.name,
          email: user.email,
          ...{ id: String(user._id), role: user.role, username: user.username, loginSessionId: token.loginSessionId },
        }
        return session
      } catch {
        // Fail closed during an outage, but do not throw: NextAuth deletes the
        // JWT cookie on callback errors. Returning null lets a later check recover.
        console.error('Unable to validate login session')
        return null as unknown as typeof session
      }
    },
  },
  events: {
    async signOut({ token }) {
      try {
        const sessionId = (token as any)?.loginSessionId
        if (!sessionId) return
        const PushDevice = (await import('@/models/PushDevice')).default
        const LoginSession = (await import('@/models/LoginSession')).default
        await connectDB()

        const session = await LoginSession.findById(sessionId)
        if (session) {
          session.revokedAt = new Date()
          if (!session.logoutAt) {
            session.logoutAt = session.revokedAt
            const loginAt = session.loginAt instanceof Date ? session.loginAt : new Date(session.loginAt)
            session.durationSeconds = Math.round((session.logoutAt.getTime() - loginAt.getTime()) / 1000)
          }
          await session.save()
        }
        await PushDevice.deleteMany({ loginSessionId: sessionId })
      } catch (err) {
        console.error('Failed to close login session on signOut:', err)
      }
    },
  },
}
