import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const BRAND_NAME = 'Jacketee'
const INFO_EMAIL = 'info@jacketee.com'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || INFO_EMAIL
const FROM_EMAIL = `"${BRAND_NAME}" <${INFO_EMAIL}>`

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
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      replyTo: INFO_EMAIL,
      to,
      subject,
      html,
    })
    console.log('Email sent:', { to, subject, messageId: info.messageId })
    return { success: true, message: 'Email sent', messageId: info.messageId }
  } catch (error: any) {
    console.error('Email error:', error)
    return { success: false, message: error.message }
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function money(value: number) {
  return `$${value.toFixed(2)}`
}

function primaryButton(label: string, href: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td style="border-radius: 8px; background: #18181b;">
          <a href="${escapeHtml(href)}" style="display: inline-block; padding: 13px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`
}

function detailBox(title: string, content: string) {
  return `
    <div style="margin: 22px 0; padding: 16px; border: 1px solid #e4e4e7; border-radius: 10px; background: #fafafa;">
      <p style="margin: 0 0 10px; color: #18181b; font-size: 14px; font-weight: 700;">${escapeHtml(title)}</p>
      ${content}
    </div>`
}

function emailLayout({
  eyebrow,
  title,
  preview,
  children,
}: {
  eyebrow: string
  title: string
  preview: string
  children: string
}) {
  const year = new Date().getFullYear()

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background: #f4f4f5; color: #18181b; font-family: Arial, Helvetica, sans-serif;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        ${escapeHtml(preview)}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f5; padding: 28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden;">
              <tr>
                <td style="background: #18181b; padding: 28px 30px; color: #ffffff;">
                  <p style="margin: 0 0 8px; color: #d4d4d8; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                    ${escapeHtml(eyebrow)}
                  </p>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; line-height: 1.2; font-weight: 800;">
                    ${escapeHtml(title)}
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  ${children}
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 30px; border-top: 1px solid #e4e4e7; background: #fafafa;">
                  <p style="margin: 0 0 8px; color: #18181b; font-size: 14px; font-weight: 700;">Need help?</p>
                  <p style="margin: 0; color: #52525b; font-size: 13px; line-height: 1.6;">
                    Reply to this email or contact us at
                    <a href="mailto:${SUPPORT_EMAIL}" style="color: #18181b; font-weight: 700;">${SUPPORT_EMAIL}</a>.
                  </p>
                </td>
              </tr>
            </table>
            <p style="max-width: 640px; margin: 18px auto 0; color: #71717a; font-size: 12px; line-height: 1.6; text-align: center;">
              (c) ${year} ${BRAND_NAME}. Custom jackets, patches, embroidery, and team apparel.<br />
              <a href="${APP_URL}" style="color: #52525b; text-decoration: underline;">${APP_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>`
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
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7;">
            <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 700;">${escapeHtml(item.name)}</p>
            <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">${escapeHtml(item.variant.name)}: ${escapeHtml(item.variant.value)}</p>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e4e4e7; color: #52525b; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${money(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('')

  return emailLayout({
    eyebrow: 'Order confirmation',
    title: `Thanks for your order, ${order.userName}`,
    preview: `Your Jacketee order ${order.orderNumber} has been received.`,
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        We received your order and our team is getting it ready. You will receive another update when your order moves forward.
      </p>
      ${detailBox(
        'Order summary',
        `<p style="margin: 0; color: #52525b; font-size: 14px;">Order number: <strong style="color: #18181b;">${escapeHtml(order.orderNumber)}</strong></p>`
      )}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr>
            <th align="left" style="padding: 0 0 10px; color: #71717a; font-size: 12px; text-transform: uppercase;">Item</th>
            <th align="center" style="padding: 0 10px 10px; color: #71717a; font-size: 12px; text-transform: uppercase;">Qty</th>
            <th align="right" style="padding: 0 0 10px; color: #71717a; font-size: 12px; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin: 18px 0 0; color: #18181b; font-size: 18px; font-weight: 800; text-align: right;">Total: ${money(order.total)}</p>
      ${detailBox(
        'Shipping address',
        `<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">
          ${escapeHtml(order.shippingAddress.name)}<br />
          ${escapeHtml(order.shippingAddress.street)}<br />
          ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.zip)}<br />
          ${escapeHtml(order.shippingAddress.country)}
        </p>`
      )}
      ${primaryButton('Visit Jacketee', APP_URL)}
    `,
  })
}

export function welcomeEmailTemplate(data: { userName: string; shopUrl: string }) {
  return emailLayout({
    eyebrow: 'Welcome to Jacketee',
    title: `Welcome, ${data.userName}`,
    preview: 'Your Jacketee account is ready.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Thanks for creating an account with Jacketee. You can now check out faster, track orders, and save your favorite jackets to your wishlist.
      </p>
      ${detailBox(
        'What you can do next',
        '<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">Browse custom jackets, compare materials and colors, or start a design when you are ready.</p>'
      )}
      ${primaryButton('Start Shopping', data.shopUrl)}
    `,
  })
}

export function newsletterSubscriptionTemplate(data: { shopUrl: string; discountCode?: string }) {
  const discountHtml = data.discountCode
    ? detailBox(
        'Your welcome offer',
        `<p style="margin: 0 0 10px; color: #52525b; font-size: 14px; line-height: 1.7;">Use this code on your first order:</p>
        <p style="margin: 0; padding: 12px 14px; border: 1px dashed #a1a1aa; border-radius: 8px; background: #ffffff; color: #18181b; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-align: center;">${escapeHtml(data.discountCode)}</p>`
      )
    : ''

  return emailLayout({
    eyebrow: 'Newsletter confirmed',
    title: 'You are subscribed to Jacketee',
    preview: 'Thanks for subscribing to Jacketee. Your welcome offer and custom jacket updates are inside.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Thanks for subscribing to Jacketee. You are now on our list for custom jacket updates, new arrivals, materials and color guides, patches, embroidery options, and occasional offers.
      </p>
      ${discountHtml}
      ${detailBox(
        'What to expect',
        '<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">We will send useful product updates, design inspiration, limited offers, and helpful guides. You can unsubscribe from promotional emails at any time.</p>'
      )}
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Need help with sizing, materials, patches, or custom embroidery? Reply to this email and our team will help.
      </p>
      ${primaryButton('Shop Jacketee', data.shopUrl)}
    `,
  })
}

export function passwordResetTemplate(data: { userName: string; resetUrl: string }) {
  return emailLayout({
    eyebrow: 'Password reset',
    title: `Reset your password, ${data.userName}`,
    preview: 'Use this secure link to reset your Jacketee password. The link expires in 1 hour.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        We received a request to reset your Jacketee account password. Use the button below to choose a new password.
      </p>
      ${primaryButton('Reset Password', data.resetUrl)}
      ${detailBox(
        'Security note',
        '<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.</p>'
      )}
      <p style="margin: 18px 0 0; color: #71717a; font-size: 12px; line-height: 1.6;">
        If the button does not work, copy and paste this link into your browser:<br />
        <span style="word-break: break-all;">${escapeHtml(data.resetUrl)}</span>
      </p>
    `,
  })
}

export function passwordChangedTemplate(data: { userName: string }) {
  return emailLayout({
    eyebrow: 'Account security',
    title: 'Your password was changed',
    preview: 'This confirms your Jacketee account password was changed.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Hi ${escapeHtml(data.userName)}, this confirms that your Jacketee account password was changed successfully.
      </p>
      ${detailBox(
        'Did not make this change?',
        `<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">Contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #18181b; font-weight: 700;">${SUPPORT_EMAIL}</a> so we can help secure your account.</p>`
      )}
      ${primaryButton('Visit Jacketee', APP_URL)}
    `,
  })
}

export function abandonedCartTemplate(data: {
  userName: string
  items: Array<{ name: string; quantity: number; price: number; image: string }>
  subtotal: number
  cartUrl: string
  stage: 'first' | 'second' | 'final'
  discountCode?: string
}) {
  const stageCopy: Record<typeof data.stage, { subject: string; title: string; message: string }> = {
    first: {
      subject: 'You left something behind',
      title: 'Your cart is saved',
      message: 'A few Jacketee picks are still waiting in your cart. You can come back whenever you are ready.',
    },
    second: {
      subject: 'Your Jacketee cart is still waiting',
      title: 'Still thinking it over?',
      message: 'Your selected items are still saved. Popular sizes and colors can sell out, so it is worth checking out soon.',
    },
    final: {
      subject: 'Last chance to complete your Jacketee order',
      title: 'Your cart expires soon',
      message: 'This is the final reminder for the items below. Complete your order before they are no longer available.',
    },
  }

  const copy = stageCopy[data.stage]
  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px;">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="54" height="54" style="display: block; width: 54px; height: 54px; border-radius: 8px; object-fit: cover;" />
                </td>
                <td>
                  <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 700;">${escapeHtml(item.name)}</p>
                  <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">Quantity: ${item.quantity}</p>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${money(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('')

  const discountHtml = data.discountCode
    ? detailBox(
        'Discount available',
        `<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">Use code <strong style="color: #18181b;">${escapeHtml(data.discountCode)}</strong> at checkout.</p>`
      )
    : ''

  return {
    subject: copy.subject,
    html: emailLayout({
      eyebrow: 'Saved cart',
      title: copy.title,
      preview: copy.message,
      children: `
        <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
          Hi ${escapeHtml(data.userName)}, ${escapeHtml(copy.message)}
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="margin: 18px 0 0; color: #18181b; font-size: 18px; font-weight: 800; text-align: right;">Subtotal: ${money(data.subtotal)}</p>
        ${discountHtml}
        ${primaryButton('Complete Your Purchase', data.cartUrl)}
      `,
    }),
  }
}

export function contactFormTemplate(data: { name: string; email: string; subject: string; message: string }) {
  return emailLayout({
    eyebrow: 'New customer inquiry',
    title: 'New contact form submission',
    preview: `${data.name} sent a new message: ${data.subject}`,
    children: `
      ${detailBox(
        'Customer details',
        `<p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.7;">
          Name: <strong style="color: #18181b;">${escapeHtml(data.name)}</strong><br />
          Email: <a href="mailto:${escapeHtml(data.email)}" style="color: #18181b; font-weight: 700;">${escapeHtml(data.email)}</a><br />
          Subject: <strong style="color: #18181b;">${escapeHtml(data.subject)}</strong>
        </p>`
      )}
      ${detailBox(
        'Message',
        `<p style="margin: 0; color: #3f3f46; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(data.message)}</p>`
      )}
    `,
  })
}

export function contactCustomerReplyTemplate(data: { name: string; subject: string }) {
  return emailLayout({
    eyebrow: 'Inquiry received',
    title: `Thanks, ${data.name}. We got your message.`,
    preview: 'Your Jacketee inquiry has been received. Our support team will reply soon.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Thanks for contacting Jacketee. We received your message and our support team will review it shortly.
      </p>
      ${detailBox(
        'Inquiry topic',
        `<p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 700;">${escapeHtml(data.subject)}</p>`
      )}
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Most inquiries are answered within 24 hours.
      </p>
      ${primaryButton('Visit Jacketee', APP_URL)}
    `,
  })
}
