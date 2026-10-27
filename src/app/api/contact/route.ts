import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, contactCustomerReplyTemplate, contactFormTemplate } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { validateContact } from '@/lib/contact-validation'
import { requireTurnstile } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Please send a valid message.' }, { status: 400 })
    }
    const denied = await requireTurnstile((body as { turnstileToken?: unknown } | null)?.turnstileToken, 'contact')
    if (denied) return denied
    const { values, errors } = validateContact(body)
    if (Object.keys(errors).length) return NextResponse.json({ error: 'Please check the highlighted fields.', errors }, { status: 400 })
    const { name, email, subject, country } = values
    const message = country ? `Delivery country: ${country}\n\n${values.message}` : values.message

    // Accept the inquiry only after it has been durably saved.
    const db = await connectDB()
    if (!db) return NextResponse.json({ error: 'We could not save your message. Please try again.' }, { status: 503 })
    await ContactMessage.create({ name, email, subject, message })

    // A notification failure must not turn a saved inquiry into a failed submission.
    const deliveries = await Promise.allSettled([
      Promise.resolve().then(() => createNotification({
        type: 'contact_form', title: 'New contact form submission',
        message: name + ': ' + subject, link: '/admin/contact-messages',
        metadata: { name, email, subject, message },
      })),
      Promise.resolve().then(() => sendEmail({
        to: process.env.SMTP_USER || 'info@jacketee.com',
        subject: 'New Contact Form Submission: ' + subject,
        html: contactFormTemplate({ name, email, subject, message }),
      })),
      Promise.resolve().then(() => sendEmail({
        to: email, subject: 'Jacketee - Inquiry Received',
        html: contactCustomerReplyTemplate({ name, subject }),
      })),
    ])
    if (deliveries.some(result => result.status === 'rejected' || (result.value && result.value.success === false))) {
      console.error('Contact message saved, but notification delivery failed')
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Contact form API error:', error)
    return NextResponse.json({ error: 'Failed to process your message' }, { status: 500 })
  }
}
