import { JACKET_VIEWS, getJacketViewLabel, getJacketTextSummary } from '@/types/jacket-customization'
import nodemailer from 'nodemailer'
import type { JacketCustomization } from '@/types/jacket-customization'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const BRAND_NAME = 'Jacketee'
const INFO_EMAIL = 'info@jacketee.com'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || INFO_EMAIL
const FROM_EMAIL = process.env.EMAIL_FROM || `"${BRAND_NAME}" <${INFO_EMAIL}>`

export type EmailResult = {
  success: boolean
  status: 'accepted' | 'failed'
  provider: string
  message: string
  code?: string
}

// Never infer a transport from the presence of SMTP credentials.
export function emailConfigurationError(): string | null {
  const provider = process.env.EMAIL_PROVIDER?.trim()
  if (provider === 'cloudflare-api') {
    return process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_EMAIL_API_TOKEN
      ? null : 'Email API is not configured'
  }
  if (provider === 'smtp') {
    return process.env.SMTP_USER && process.env.SMTP_PASS ? null : 'SMTP is not configured'
  }
  return provider === 'disabled' ? 'Email is disabled' : 'Select an explicit email provider'
}

export async function sendEmail({ to, subject, html, attachments }: {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer; contentType: string }[]
}): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim() || 'unconfigured'
  const fail = (code: string, httpStatus?: number): EmailResult => {
    console.error('Email delivery failed', { provider, code, ...(httpStatus ? { httpStatus } : {}) })
    return { success: false, status: 'failed', provider, code, message: 'Email could not be accepted. Please try again later.' }
  }
  const accepted = (): EmailResult => ({ success: true, status: 'accepted', provider, message: 'Email accepted by provider' })
  if (emailConfigurationError()) return fail('CONFIGURATION')
  if (process.env.MIGRATION_TEST_MODE === 'true') {
    const allowed = (process.env.EMAIL_TEST_RECIPIENTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
    if (!allowed.includes(to.trim().toLowerCase()) || /[,;<>\r\n]/.test(to)) return fail('TEST_RECIPIENT_NOT_ALLOWED')
  }
  try {
    if (provider === 'cloudflare-api') {
      const namedFrom = FROM_EMAIL.match(/^(.*?)\s*<([^<>]+)>$/)
      const payload = JSON.stringify({
        from: namedFrom ? { address: namedFrom[2], name: namedFrom[1].trim().replace(/^"|"$/g, '') } : FROM_EMAIL,
        to, subject, html, reply_to: INFO_EMAIL,
        attachments: attachments?.map(file => ({ filename: file.filename, content: file.content.toString('base64'), type: file.contentType, disposition: 'attachment' })),
      })
      if (new TextEncoder().encode(payload).byteLength > 5 * 1024 * 1024) return fail('MESSAGE_TOO_LARGE')
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(process.env.CLOUDFLARE_ACCOUNT_ID!)}/email/sending/send`, {
        method: 'POST', headers: { authorization: `Bearer ${process.env.CLOUDFLARE_EMAIL_API_TOKEN}`, 'content-type': 'application/json' },
        body: payload, signal: AbortSignal.timeout(15000),
      })
      const result = await response.json().catch(() => null) as {
        success?: boolean; errors?: { code?: number }[]
        result?: { delivered?: string[]; queued?: string[]; permanent_bounces?: string[] }
      } | null
      const recipients = [...(result?.result?.delivered || []), ...(result?.result?.queued || [])]
      if (!response.ok || !result?.success || !recipients.some(address => address.toLowerCase() === to.toLowerCase()) || result.result?.permanent_bounces?.length) {
        return fail(result?.errors?.[0]?.code ? `API_${result.errors[0].code}` : 'API_REJECTED', response.status)
      }
      return accepted()
    }
    // SMTP is retained only as an explicit opt-in for supported environments.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    try {
      const info = await transporter.sendMail({ from: FROM_EMAIL, replyTo: INFO_EMAIL, to, subject, html, attachments })
      if (!info.accepted?.some((address: unknown) => String(address).toLowerCase() === to.toLowerCase())) return fail('SMTP_REJECTED')
      return accepted()
    } finally { transporter.close() }
  } catch (cause: unknown) {
    const error = cause as { name?: string; code?: string }
    // Only log allowlisted diagnostics, never provider messages, recipients or tokens.
    const code = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'TIMEOUT'
      : typeof error?.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code) ? error.code : 'CONNECTION_FAILED'
    return fail(code)
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
              © ${year} ${BRAND_NAME}. Custom jackets, patches, embroidery, and team apparel.<br />
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
  items: Array<{ name: string; quantity: number; price: number; variant: { name: string; value: string }; customization?: JacketCustomization }>
  total: number
  shippingAddress: { name: string; street: string; city: string; state: string; zip: string; country: string }
}) {
  const itemsHtml = order.items
    .map(
      (item) => {
        const customization = JACKET_VIEWS
          .map((view) => {
            const side = item.customization?.[view]
            const details = [
              getJacketTextSummary(side) ? `Text: ${getJacketTextSummary(side)}` : '',
              ...(side?.artworks || []).map((artwork) => `Artwork: ${artwork.name}`),
            ].filter(Boolean)
            return details.length ? `${getJacketViewLabel(view)} - ${details.join(', ')}` : ''
          })
          .filter(Boolean)
        return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7;">
            <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 700;">${escapeHtml(item.name)}</p>
            <p style="margin: 4px 0 0; color: #71717a; font-size: 12px;">${escapeHtml(item.variant.name)}: ${escapeHtml(item.variant.value)}</p>
            ${customization.map((detail) => `<p style="margin: 4px 0 0; color: #52525b; font-size: 12px;">${escapeHtml(detail)}</p>`).join('')}
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e4e4e7; color: #52525b; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e4e4e7; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${money(item.price * item.quantity)}</td>
        </tr>`
      }
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

export function guestOrderClaimTemplate(data: { claimUrl: string }) {
  return emailLayout({
    eyebrow: 'Order history',
    title: 'Add guest orders to your account',
    preview: 'Verify your checkout email to see earlier Jacketee orders in your account.',
    children: `
      <p style="margin: 0; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        A Jacketee account requested to link orders placed with this email address. Open the link below and sign in to that account to confirm.
      </p>
      ${primaryButton('Link My Orders', data.claimUrl)}
      <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.6;">
        This link expires in 30 minutes. If you did not request this, ignore this email. Your orders will stay unchanged.
      </p>
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

export function reviewRequestTemplate(data: {
  userName: string
  orderNumber: string
  products: Array<{ name: string; reviewUrl: string }>
}) {
  const productRows = data.products
    .map((product) => `<li style="margin: 0 0 8px;"><a href="${escapeHtml(product.reviewUrl)}" style="color: #18181b; font-weight: 700;">${escapeHtml(product.name)}</a></li>`)
    .join('')
  const primaryReviewUrl = data.products[0]?.reviewUrl || APP_URL

  return emailLayout({
    eyebrow: 'Share your experience',
    title: `How did your order turn out, ${data.userName}?`,
    preview: `Tell us what you think about your Jacketee order ${data.orderNumber}.`,
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Your order has arrived, and we would value your honest feedback. Reviews help other customers choose the right jacket and help our team improve.
      </p>
      ${detailBox(
        'Order details',
        `<p style="margin: 0 0 10px; color: #52525b; font-size: 14px;">Order: <strong style="color: #18181b;">${escapeHtml(data.orderNumber)}</strong></p><ul style="margin: 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.6;">${productRows}</ul>`
      )}
      ${primaryButton('Write a Review', primaryReviewUrl)}
      <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.6;">Please share only your genuine experience. Your review will appear after moderation.</p>
    `,
  })
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

export function contactCustomerReplyTemplate(data: { name: string; email: string; subject: string; message: string }) {
  return emailLayout({
    eyebrow: 'Inquiry received',
    title: `Thanks, ${data.name}. We got your message.`,
    preview: 'Your Jacketee inquiry has been received. Our support team will reply soon.',
    children: `
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Thanks for contacting Jacketee. We received your message and our support team will review it shortly.
      </p>
      ${detailBox(
        'Your submitted details',
        `<p style="margin: 0; white-space: pre-wrap;">Name: ${escapeHtml(data.name)}<br />Email: ${escapeHtml(data.email)}<br />Subject: ${escapeHtml(data.subject)}<br /><br />${escapeHtml(data.message)}</p>`
      )}
      <p style="margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.7;">
        Most inquiries are answered within 24 hours.
      </p>
      ${primaryButton('Visit Jacketee', APP_URL)}
    `,
  })
}
