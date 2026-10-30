import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth-options'

const handler = NextAuth(authOptions)
// NextAuth v4's browser client expects an object for an unauthenticated
// session. Keep the server callback null (fail closed), normalize only HTTP.
export async function GET(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const response = await handler(request, context)
  if (new URL(request.url).pathname.endsWith('/session') && response.ok &&
      await response.clone().text() === 'null') {
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.set('content-type', 'application/json')
    headers.set('cache-control', 'no-store')
    return new Response('{}', { status: response.status, headers })
  }
  return response
}
export { handler as POST }
