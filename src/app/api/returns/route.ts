import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { requireTurnstile } from '@/lib/turnstile'
import { boundedText, RequestBodyTooLarge } from '@/lib/request-body'
import { parseReturnInput, submitReturn } from '@/lib/return-request'
import { createNotification } from '@/lib/notifications'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'Invalid request origin' }, 403)
  try {
    let input
    try { input = parseReturnInput(JSON.parse(await boundedText(request, 10 * 1024))) }
    catch (error) {
      return json({ error: error instanceof RequestBodyTooLarge ? 'Request is too large' : 'Check your order number, email and reason.' }, error instanceof RequestBodyTooLarge ? 413 : 400)
    }
    const denied = await requireTurnstile(input.turnstileToken, 'returns')
    if (denied) return denied
    const session = await getServerSession(authOptions)
    const user = session?.user as { id?: string } | undefined
    const result = await submitReturn(input, user)
    if ('error' in result) return json({ error: result.error }, result.status)
    if (result.inserted) {
      await createNotification({
        type: 'refund_request', title: 'New refund/return request',
        message: `Order ${result.orderNumber}`, link: '/admin/refunds',
      }).catch(() => console.error('Return request saved, but admin notification failed'))
    }
    return json({ success: true, id: result.id }, 201)
  } catch {
    console.error('Return submission unavailable')
    return json({ error: 'Returns are temporarily unavailable. Please try again.' }, 503)
  }
}
