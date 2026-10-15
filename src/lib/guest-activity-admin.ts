import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

/** JWT roles alone cannot revoke access after an account is disabled or demoted. */
export async function requireGuestActivityAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!user?.id || user.role !== 'admin' || !isValidObjectId(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!await connectDB()) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }
  const account = await User.findById(user.id).select('role isActive').lean()
  if (!account || account.role !== 'admin' || account.isActive === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
