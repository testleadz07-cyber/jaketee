import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, contactCustomerReplyTemplate, contactFormTemplate } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { connectDB } from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

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
  } catch (error: any) {
    console.error('Contact form API error:', error)
    return NextResponse.json({ error: 'Failed to process your message' }, { status: 500 })
  }
}
