import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import LoginSession from '@/models/LoginSession'

// Check current database state, not the identity/role cached in the JWT.
export async function getActiveSessionUser(userId: unknown, loginSessionId: unknown) {
  if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId) ||
      typeof loginSessionId !== 'string' || !/^[a-f\d]{24}$/i.test(loginSessionId)) return null
  if (!await connectDB()) throw new Error('Session database unavailable')
  const [user, login] = await Promise.all([
    User.findOne({ _id: userId, isActive: { $ne: false } }).select('_id name email username role').lean(),
    LoginSession.findOne({ _id: loginSessionId, userId, revokedAt: null }).select('_id').lean(),
  ])
  return user && login ? user : null
}
