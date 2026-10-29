import 'server-only'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'

type AdminUser = NonNullable<Awaited<ReturnType<typeof getServerSession>>>['user'] & { id: string; role: 'admin' }
type AdminAuthorization = { user: AdminUser; response?: never } | { user?: never; response: NextResponse }

// authOptions.session checks the current account and unrevoked login in MongoDB.
// Do not replace this with a role read from an unrefreshed JWT.
export async function requireAdminApi(): Promise<AdminAuthorization> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } }) }
  if ((session.user as { role?: string }).role !== 'admin') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } }) }
  }
  return { user: session.user as AdminUser }
}

export async function requireAdminPage(): Promise<AdminUser> {
  const auth = await requireAdminApi()
  if (auth.response) redirect('/login?callbackUrl=/admin/dashboard')
  return auth.user
}
