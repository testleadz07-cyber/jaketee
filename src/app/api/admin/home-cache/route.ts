import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { invalidateHomeCache } from '@/lib/home-cache'

// Image settings currently have no in-site editor. Admin tooling can expire
// home, materials and patches image caches after saving SectionImage records.
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  const session = await getServerSession(authOptions)
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!user?.id || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await connectDB()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  if (!await User.exists({ _id: user.id, role: 'admin', isActive: { $ne: false } })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  invalidateHomeCache('images')
  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
}
