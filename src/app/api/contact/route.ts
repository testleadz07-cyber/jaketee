import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, contactFormTemplate } from '@/lib/email'
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

    // Send email to store owner (SMTP_USER or EMAIL_FROM)
    const adminEmail = process.env.SMTP_USER || 'admin@luxestore.com'
    const ownerEmailHtml = contactFormTemplate({ name, email, subject, message })
    
    await sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: ownerEmailHtml,
    })

    // Send auto-reply to customer
    const customerReplyHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #18181b; margin-top: 0;">We received your message!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for contacting LUXE STORE. We have received your inquiry regarding <strong>"${subject}"</strong>.</p>
        <p>Our customer support team will review your message and respond within 24 hours.</p>
        <br />
        <p style="color: #71717a; font-size: 12px; margin-bottom: 0;">This is an automated response. Please do not reply directly to this email.</p>
      </div>
    `
    
    await sendEmail({
      to: email,
      subject: 'LUXE STORE - Inquiry Received',
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
