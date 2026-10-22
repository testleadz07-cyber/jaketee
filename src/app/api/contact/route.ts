import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, contactCustomerReplyTemplate, contactFormTemplate } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { validateContact } from '@/lib/contact-validation'

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Please send a valid message.' }, { status: 400 })
    }
    const { values, errors } = validateContact(body)
    if (Object.keys(errors).length) return NextResponse.json({ error: 'Please check the highlighted fields.', errors }, { status: 400 })
    const { name, email, subject, country } = values
    const message = country ? `Delivery country: ${country}\n\n${values.message}` : values.message

    // Send email to store owner
    const adminEmail = process.env.SMTP_USER || 'info@jacketee.com'
    const ownerEmailHtml = contactFormTemplate({ name, email, subject, message })
    
    await sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: ownerEmailHtml,
    })

    // Send auto-reply to customer
    const customerReplyHtml = contactCustomerReplyTemplate({ name, subject })
    
    await sendEmail({
      to: email,
      subject: 'Jacketee - Inquiry Received',
      html: customerReplyHtml,
    })

    const db = await connectDB()
    if (db) {
      await ContactMessage.create({ name, email, subject, message })
    }

    await createNotification({
      type: 'contact_form',
      title: 'New contact form submission',
      message: `${name}: ${subject}`,
      metadata: { name, email, subject, message },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Contact form API error:', error)
    return NextResponse.json({ error: 'Failed to process your message' }, { status: 500 })
  }
}
