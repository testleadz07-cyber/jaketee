import { NextRequest, NextResponse } from 'next/server'
import { contactFormTemplate, sendEmail } from '@/lib/email'
import { shippingCountryError } from '@/config/fulfillment'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { createNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(`bulk-quote:${getClientIp(request)}`, 5, 60 * 60 * 1000)
  if (!limit.success) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: rateLimitHeaders(limit) })
  if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return NextResponse.json({ error: 'Your request is too large.' }, { status: 413 })
  try {
    const form = await request.formData()
    const fields = ['name', 'email', 'organization', 'quantity', 'jacketType', 'deadline', 'country'] as const
    const data = Object.fromEntries(fields.map(key => [key, String(form.get(key) || '').trim()]))
    if (fields.some(key => !data[key] || data[key].length > 200) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json({ error: 'Please complete all fields with a valid email address.' }, { status: 400 })
    }
    if (!Number.isSafeInteger(Number(data.quantity)) || Number(data.quantity) < 10 || !/^\d{4}-\d{2}-\d{2}$/.test(data.deadline) || Number.isNaN(Date.parse(data.deadline))) {
      return NextResponse.json({ error: 'Enter a quantity of at least 10 and a valid deadline.' }, { status: 400 })
    }
    const countryError = shippingCountryError(data.country)
    if (countryError) return NextResponse.json({ error: countryError }, { status: 400 })
    const logo = form.get('logo')
    const attachments = []
    if (logo instanceof File && logo.size > 0) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type) || logo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Choose a PNG, JPG, or WebP logo up to 5 MB.' }, { status: 400 })
      }
      attachments.push({ filename: logo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100), content: Buffer.from(await logo.arrayBuffer()), contentType: logo.type })
    }
    const subject = 'Bulk jacket quote request'
    const message = [
      ...fields.map(key => `${key}: ${data[key]}`),
      ...(attachments.length ? [`Logo attachment: ${attachments[0].filename} (included in the notification email)`] : []),
    ].join('\n')
    const db = await connectDB()
    if (!db) return NextResponse.json({ error: 'We could not save your quote request. Please try again or email info@jacketee.com.' }, { status: 503 })
    await ContactMessage.create({ name: data.name, email: data.email, subject, message, read: false })
    await createNotification({
      type: 'contact_form',
      title: 'New bulk quote request',
      message: `${data.name}: ${data.organization} — ${data.quantity} jackets`,
      link: '/admin/contact-messages',
      metadata: { name: data.name, email: data.email, subject },
    })
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
