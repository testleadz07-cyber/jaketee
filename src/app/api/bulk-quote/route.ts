import { NextRequest, NextResponse } from 'next/server'
import { contactFormTemplate, sendEmail } from '@/lib/email'
import { shippingCountryError } from '@/config/fulfillment'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { createNotification } from '@/lib/notifications'
import { requireTurnstile } from '@/lib/turnstile'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(`bulk-quote:${getClientIp(request)}`, 5, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: rateLimitHeaders(limit) })
  if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return NextResponse.json({ error: 'Your request is too large.' }, { status: 413 })
  try {
    const form = await request.formData()
    const denied = await requireTurnstile(form.get('turnstileToken'), 'bulk_quote')
    if (denied) return denied
    const fields = ['name', 'email', 'organization', 'quantity', 'jacketType', 'deadline', 'country', 'program', 'notes'] as const
    const data = Object.fromEntries(fields.map(key => [key, String(form.get(key) || '').trim()]))
    const fieldErrors: Record<string, string> = {}
    for (const key of ['name', 'email', 'organization', 'quantity', 'jacketType', 'country'] as const) {
      if (!data[key] || data[key].length > 200) fieldErrors[key] = 'Enter a value of up to 200 characters.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fieldErrors.email = 'Enter a valid email address.'
    if (!Number.isSafeInteger(Number(data.quantity)) || Number(data.quantity) < 10) fieldErrors.quantity = 'Enter a whole number of at least 10.'
    if (data.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(data.deadline) || Number.isNaN(Date.parse(data.deadline)) || new Date(data.deadline).toISOString().slice(0, 10) !== data.deadline)) fieldErrors.deadline = 'Enter a valid date or leave it blank.'
    if (data.program.length > 200) fieldErrors.program = 'Choose a shorter program name.'
    if (data.notes.length > 4000) fieldErrors.notes = 'Use 4,000 characters or fewer.'
    const countryError = shippingCountryError(data.country)
    if (countryError) fieldErrors.country = countryError
    if (Object.keys(fieldErrors).length) return NextResponse.json({ error: 'Please check the highlighted fields.', fieldErrors }, { status: 400 })
    const logo = form.get('logo')
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []
    if (logo instanceof File && logo.size > 0) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type) || logo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Choose a PNG, JPG, or WebP logo up to 5 MB.', fieldErrors: { logo: 'Choose a PNG, JPG, or WebP logo up to 5 MB.' } }, { status: 400 })
      }
      attachments.push({ filename: logo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100), content: Buffer.from(await logo.arrayBuffer()), contentType: logo.type })
    }
    const subject = 'Bulk jacket quote request'
    const message = [
      ...fields.map(key => `${key}: ${data[key] || (key === 'deadline' ? 'Not sure yet' : 'Not provided')}`),
      ...(attachments.length ? [`Logo attachment: ${attachments[0].filename} (saved with the inquiry and included in the notification email)`] : []),
    ].join('\n')
    const db = await connectDB()
    if (!db) return NextResponse.json({ error: 'We could not save your quote request. Please try again or email info@jacketee.com.' }, { status: 503 })
    await ContactMessage.create({ name: data.name, email: data.email, subject, message, read: false, attachments })
    await createNotification({
      type: 'contact_form',
      title: 'New bulk quote request',
      message: `${data.name}: ${data.organization} — ${data.quantity} jackets`,
      link: '/admin/contact-messages',
      metadata: { name: data.name, email: data.email, subject },
    }).catch(() => console.error('Bulk quote saved, but admin notification failed'))
    // The saved inquiry is the source of truth; email failure must not prompt duplicate submissions.
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const result = await sendEmail({ to: process.env.SMTP_USER, subject, html: contactFormTemplate({ name: data.name, email: data.email, subject, message }), attachments })
        if (!result.success) console.error('Bulk quote saved, but notification email delivery failed')
      } else console.error('Bulk quote saved, but notification email is not configured')
    } catch {
      console.error('Bulk quote saved, but notification email delivery failed')
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'We could not save your quote request. Please try again or email info@jacketee.com.' }, { status: 500 })
  }
}
