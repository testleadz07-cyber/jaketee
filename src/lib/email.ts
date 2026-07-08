import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured. Would send to:', to, 'Subject:', subject)
    return { success: true, message: 'Email not configured (logged only)' }
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"LUXE STORE" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return { success: true, message: 'Email sent' }
  } catch (error: any) {
    console.error('Email error:', error)
    return { success: false, message: error.message }
  }
}

export function orderConfirmationTemplate(order: {
  orderNumber: string
  userName: string
  items: Array<{ name: string; quantity: number; price: number; variant: { name: string; value: string } }>
  total: number
  shippingAddress: { name: string; street: string; city: string; state: string; zip: string; country: string }
}) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name} (${item.variant.name}: ${item.variant.value})</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join('')

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #18181b; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LUXE STORE</h1>
        <p style="margin: 8px 0 0; opacity: 0.8;">Order Confirmation</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p>Dear ${order.userName},</p>
        <p>Thank you for your order! Here are the details:</p>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f4f4f5;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; margin: 16px 0;">
          <p style="font-size: 18px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
        </div>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Shipping Address:</strong></p>
          <p style="margin: 0;">${order.shippingAddress.name}</p>
          <p style="margin: 0;">${order.shippingAddress.street}</p>
          <p style="margin: 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
          <p style="margin: 0;">${order.shippingAddress.country}</p>
        </div>
        <p style="color: #71717a; font-size: 14px;">If you have any questions, reply to this email or contact us at support@luxestore.com</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
        © ${new Date().getFullYear()} LUXE STORE. All rights reserved.
      </div>
    </div>`
}

export function passwordResetTemplate(data: { userName: string; resetUrl: string }) {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #18181b; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LUXE STORE</h1>
        <p style="margin: 8px 0 0; opacity: 0.8;">Password Reset Request</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p>Hi ${data.userName},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetUrl}" style="background: #18181b; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #71717a; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #71717a; font-size: 13px; word-break: break-all;">${data.resetUrl}</p>
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
        © ${new Date().getFullYear()} LUXE STORE. All rights reserved.
      </div>
    </div>`
}

export function abandonedCartTemplate(data: {
  userName: string
  items: Array<{ name: string; quantity: number; price: number; image: string }>
  subtotal: number
  cartUrl: string
  // Increasingly urgent copy depending on how long the cart has sat idle.
  stage: 'first' | 'second' | 'final'
  discountCode?: string
}) {
  const stageCopy: Record<typeof data.stage, { subject: string; heading: string; message: string }> = {
    first: {
      subject: 'You left something behind',
      heading: 'Still thinking it over?',
      message: 'You left a few great picks in your cart. They\'re still saved and ready whenever you are.',
    },
    second: {
      subject: 'Your cart is waiting for you',
      heading: 'Your items are still here',
      message: 'Just a reminder — the items below are still in your cart. Popular sizes and colors can sell out, so grab them before they\'re gone.',
    },
    final: {
      subject: 'Last chance — your cart expires soon',
      heading: 'Don\'t miss out',
      message: 'This is your final reminder. Complete your order now before these items sell out.',
    },
  }

  const copy = stageCopy[data.stage]

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" width="48" height="48" style="border-radius: 6px; object-fit: cover; vertical-align: middle; margin-right: 12px;" />
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join('')

  return {
    subject: copy.subject,
    html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #18181b; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LUXE STORE</h1>
        <p style="margin: 8px 0 0; opacity: 0.8;">${copy.heading}</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p>Hi ${data.userName},</p>
        <p>${copy.message}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f4f4f5;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; margin: 16px 0;">
          <p style="font-size: 18px;"><strong>Subtotal: $${data.subtotal.toFixed(2)}</strong></p>
        </div>
        ${data.discountCode ? `
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
          <p style="margin: 0 0 4px;">Use code <strong>${data.discountCode}</strong> at checkout for a discount on your order.</p>
        </div>` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.cartUrl}" style="background: #18181b; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Complete Your Purchase
          </a>
        </div>
        <p style="color: #71717a; font-size: 14px;">If you have any questions, reply to this email or contact us at support@luxestore.com</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
        © ${new Date().getFullYear()} LUXE STORE. All rights reserved.
      </div>
    </div>`,
  }
}

export function contactFormTemplate(data: { name: string; email: string; subject: string; message: string }) {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #18181b; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0;">New Contact Form Submission</h1>
      </div>
      <div style="padding: 24px; background: white;">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f4f4f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${data.message}</p>
      </div>
    </div>`
}