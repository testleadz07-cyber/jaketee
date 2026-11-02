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
        to: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL ||
          (process.env.SMTP_USER?.includes('@') ? process.env.SMTP_USER : 'info@jacketee.com'),
        subject: 'New Contact Form Submission: ' + subject,
        html: contactFormTemplate({ name, email, subject, message }),
      })),
      Promise.resolve().then(() => sendEmail({
        to: email, subject: 'Jacketee - Inquiry Received',
        html: contactCustomerReplyTemplate({ name, email, subject, message }),
      })),
    ])
    if (deliveries.some(result => result.status === 'rejected' || (result.value && result.value.success === false))) {
      console.error('Contact message saved, but notification delivery failed')
    }

    const emailStatus = {
      admin: deliveries[1].status === 'fulfilled' && deliveries[1].value.success === true ? 'accepted' : 'failed',
      customer: deliveries[2].status === 'fulfilled' && deliveries[2].value.success === true ? 'accepted' : 'failed',
    }
    const emailFailed = Object.values(emailStatus).includes('failed')
    return NextResponse.json({ success: true, saved: true, emailStatus, message: emailFailed
      ? 'Your message is saved, but one or more notification emails could not be sent. Please do not resubmit. Contact info@jacketee.com if you need help.'
      : 'Your message is saved. Notification and acknowledgement emails were accepted for sending; please check your inbox and spam folder.' })
  } catch (error: unknown) {
    console.error('Contact form API error:', error)
    return NextResponse.json({ error: 'Failed to process your message' }, { status: 500 })
  }
}
