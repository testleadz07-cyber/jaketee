import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword } from '@/lib/auth'
import { isLoginLocked, recordFailedLogin, resetLoginAttempts } from '@/lib/rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password')
        }

        const email = credentials.email

        // Per-account lockout guards against credential stuffing / brute
        // force from rotating IPs (middleware only rate-limits per IP).
        const lockStatus = isLoginLocked(email)
        if (lockStatus.locked) {
          throw new Error('Too many failed login attempts. Please try again later.')
        }

        const db = await connectDB()
        if (db) {
          const user = await User.findOne({ email })
          const isValid = user ? await comparePassword(credentials.password, user.password) : false
          if (!user || !isValid) {
            recordFailedLogin(email)
            throw new Error('Invalid email or password')
          }
          if (user.isActive === false) {
            throw new Error('This account has been disabled. Please contact support.')
          }
          resetLoginAttempts(email)
          return { id: String(user._id), email: user.email, name: user.name, role: user.role }
        }

        // Fallback: hardcoded admin (no DB)
        if (email === 'admin@luxestore.com' && credentials.password === 'admin123') {
          resetLoginAttempts(email)
          return { id: '1', email: 'admin@luxestore.com', name: 'Admin User', role: 'admin' }
        }

        recordFailedLogin(email)
        throw new Error('Invalid email or password')
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
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.userId;
      }
      return session
    },
  },
}