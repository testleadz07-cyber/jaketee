import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword } from '@/lib/auth'

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

        const db = await connectDB()
        if (db) {
          const user = await User.findOne({ email: credentials.email })
          if (!user) throw new Error('Invalid email or password')
          const isValid = await comparePassword(credentials.password, user.password)
          if (!isValid) throw new Error('Invalid email or password')
          return { id: String(user._id), email: user.email, name: user.name, role: user.role }
        }

        // Fallback: hardcoded admin (no DB)
        if (credentials.email === 'admin@luxestore.com' && credentials.password === 'admin123') {
          return { id: '1', email: 'admin@luxestore.com', name: 'Admin User', role: 'admin' }
        }

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