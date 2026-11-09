import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, RGB } from 'pdf-lib'

export interface InvoiceOrderItem {
  name: string
  image?: string
  price: number
  quantity: number
  variants?: Array<{ name: string; value: string }>
}

export interface InvoiceOrderData {
  orderNumber: string
  createdAt: string | Date
  userName: string
  userEmail: string
  items: InvoiceOrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discountAmount?: number
  promoCode?: string
  total: number
  paymentMethod?: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
  }
}

const PAGE_WIDTH = 612 // US Letter, points
const PAGE_HEIGHT = 792
const MARGIN = 50

const INK: RGB = rgb(0.09, 0.09, 0.11) // near-black
const MUTED: RGB = rgb(0.45, 0.45, 0.48)
const LINE: RGB = rgb(0.87, 0.87, 0.89)
const ACCENT: RGB = rgb(0.09, 0.09, 0.11) // brand black, matches header styling
const PANEL: RGB = rgb(0.96, 0.96, 0.97)
const WHITE: RGB = rgb(1, 1, 1)

function money(n: number) {
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`
}

function formatDate(d: string | Date) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Generates a formal invoice/receipt PDF for a given order.
 * Uses pdf-lib for pure-JS PDF construction (no headless browser dependency).
 */
export async function generateInvoicePdf(order: InvoiceOrderData, options: { standalone?: boolean } = {}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Invoice ${order.orderNumber}`)
  pdfDoc.setAuthor('Jacketee')
  pdfDoc.setSubject(options.standalone ? 'Invoice' : 'Order Invoice / Receipt')

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  const drawText = (
    text: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: RGB; align?: 'left' | 'right' } = {}
  ) => {
    const font = opts.font ?? fontRegular
    const size = opts.size ?? 10
    const color = opts.color ?? INK
    let drawX = x
    if (opts.align === 'right') {
      const width = font.widthOfTextAtSize(text, size)
      drawX = x - width
    }
    page.drawText(text, { x: drawX, y: yy, size, font, color })
  }

  const drawLine = (x1: number, yy: number, x2: number, color: RGB = LINE, thickness = 1) => {
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness, color })
  }

  // ---------- Header band ----------
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 96, width: PAGE_WIDTH, height: 96, color: ACCENT })
  drawText('Jacketee', MARGIN, PAGE_HEIGHT - 45, { font: fontBold, size: 22, color: WHITE })
  drawText('Adalat Garh, Sialkot, Punjab, Pakistan', MARGIN, PAGE_HEIGHT - 63, {
    size: 9,
    color: rgb(0.85, 0.85, 0.87),
  })
  drawText('info@jacketee.com  •  www.jacketee.com', MARGIN, PAGE_HEIGHT - 77, {
    size: 9,
    color: rgb(0.85, 0.85, 0.87),
  })

  drawText(options.standalone ? 'INVOICE' : 'INVOICE / RECEIPT', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 45, {
    font: fontBold,
    size: 16,
    color: WHITE,
    align: 'right',
  })
  drawText(`#${order.orderNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 63, {
    font: fontBold,
    size: 11,
    color: rgb(0.85, 0.85, 0.87),
    align: 'right',
  })
  drawText(`Issued ${formatDate(order.createdAt)}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 77, {
    size: 9,
    color: rgb(0.85, 0.85, 0.87),
    align: 'right',
  })

  y = PAGE_HEIGHT - 96 - 30

  // ---------- Bill To / Ship To / Payment ----------
  const colWidth = (PAGE_WIDTH - MARGIN * 2 - 40) / 3
  const col1X = MARGIN
  const col2X = MARGIN + colWidth + 20
  const col3X = MARGIN + (colWidth + 20) * 2

  const wrapText = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
    const lines: string[] = []
    let line = ''
    for (const word of text.trim().split(/\s+/)) {
      if (!word) continue
      if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > maxWidth) {
        lines.push(line)
        line = ''
      }
      // Split unusually long words too, keeping every line inside its column.
      for (const character of (line ? ` ${word}` : word)) {
        if (line && font.widthOfTextAtSize(line + character, size) > maxWidth) {
          lines.push(line)
          line = ''
        }
        line += character
      }
    }
    if (line) lines.push(line)
    return lines
  }

  const drawTextWrapped = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    opts: { font?: PDFFont; size?: number; color?: RGB; align?: 'left' | 'right' } = {}
  ): number => {
    const font = opts.font ?? fontRegular
    const size = opts.size ?? 10
    const lines = wrapText(text, maxWidth, font, size)
    let currentY = startY
    for (const line of lines) {
      drawText(line, x, currentY, opts)
      currentY -= (size + 4)
    }
    return currentY
  }

  const blockTop = y
  
  // Column 1
  drawText('BILLED TO', col1X, blockTop, { font: fontBold, size: 9, color: MUTED })
  let y1 = blockTop - 16
  y1 = drawTextWrapped(order.userName, col1X, y1, colWidth, { font: fontBold, size: 10 })
  y1 = drawTextWrapped(order.userEmail, col1X, y1, colWidth, { size: 9, color: MUTED })

  // Column 2
  drawText('SHIPPED TO', col2X, blockTop, { font: fontBold, size: 9, color: MUTED })
  let y2 = blockTop - 16
  y2 = drawTextWrapped(order.shippingAddress.name, col2X, y2, colWidth, { font: fontBold, size: 10 })
  y2 = drawTextWrapped(order.shippingAddress.street, col2X, y2, colWidth, { size: 9, color: MUTED })
  y2 = drawTextWrapped(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
    col2X,
    y2,
    colWidth,
    { size: 9, color: MUTED }
  )
  y2 = drawTextWrapped(order.shippingAddress.country, col2X, y2, colWidth, { size: 9, color: MUTED })

  // Column 3
  drawText('PAYMENT', col3X, blockTop, { font: fontBold, size: 9, color: MUTED })
  let y3 = blockTop - 16
  y3 = drawTextWrapped(
    order.paymentMethod
      ? ({ bank_transfer: 'Bank Transfer', paypal: 'PayPal', stripe: 'Stripe', cash: 'Cash', other: 'Other' }[order.paymentMethod]
        || order.paymentMethod.replace(/_/g, ' '))
      : 'N/A',
    col3X,
    y3,
    colWidth,
    { font: fontBold, size: 10 }
  )
  y3 = drawTextWrapped(`${options.standalone ? 'Invoice' : 'Order'} Date: ${formatDate(order.createdAt)}`, col3X, y3, colWidth, { size: 9, color: MUTED })
  if (order.promoCode) {
    y3 = drawTextWrapped(`Promo: ${order.promoCode}`, col3X, y3, colWidth, { size: 9, color: MUTED })
  }

  y = Math.min(y1, y2, y3) - 10
  drawLine(MARGIN, y, PAGE_WIDTH - MARGIN)
  y -= 24

  // ---------- Items table header ----------
  const tableTop = y
  const colProductX = MARGIN
  const colQtyX = PAGE_WIDTH - MARGIN - 210
  const colPriceX = PAGE_WIDTH - MARGIN - 130
  const colTotalX = PAGE_WIDTH - MARGIN

  page.drawRectangle({
    x: MARGIN - 6,
    y: tableTop - 6,
    width: PAGE_WIDTH - MARGIN * 2 + 12,
    height: 22,
    color: PANEL,
  })
  drawText('PRODUCT', colProductX, tableTop, { font: fontBold, size: 9, color: MUTED })
  drawText('QTY', colQtyX, tableTop, { font: fontBold, size: 9, color: MUTED })
  drawText('UNIT PRICE', colPriceX, tableTop, { font: fontBold, size: 9, color: MUTED, align: 'right' })
  drawText('AMOUNT', colTotalX, tableTop, { font: fontBold, size: 9, color: MUTED, align: 'right' })

  y = tableTop - 28

  const ensureSpace = (needed: number) => {
    if (y - needed < 130) {
      newPage()
      // redraw a slim continuation header
      drawText(`Invoice ${order.orderNumber} (continued)`, MARGIN, y, { font: fontBold, size: 11, color: MUTED })
      y -= 24
      page.drawRectangle({
        x: MARGIN - 6,
        y: y - 6,
        width: PAGE_WIDTH - MARGIN * 2 + 12,
        height: 22,
        color: PANEL,
      })
      drawText('PRODUCT', colProductX, y, { font: fontBold, size: 9, color: MUTED })
      drawText('QTY', colQtyX, y, { font: fontBold, size: 9, color: MUTED })
      drawText('UNIT PRICE', colPriceX, y, { font: fontBold, size: 9, color: MUTED, align: 'right' })
      drawText('AMOUNT', colTotalX, y, { font: fontBold, size: 9, color: MUTED, align: 'right' })
      y -= 28
    }
  }

  for (const item of order.items) {
    const variantText =
      item.variants && item.variants.length > 0
        ? item.variants.map((v) => `${v.name}: ${v.value}`).join(', ')
        : ''

    const nameMaxWidth = colQtyX - colProductX - 20
    const nameLines = wrapText(item.name, nameMaxWidth, fontBold, 10)
    const variantLines = wrapText(variantText, nameMaxWidth, fontRegular, 8.5)
    const nameHeight = Math.max(1, nameLines.length) * 14
    const variantHeight = variantLines.length * 12.5
    ensureSpace(nameHeight + variantHeight + 20)

    nameLines.forEach((line, index) => {
      drawText(line, colProductX, y - index * 14, { font: fontBold, size: 10 })
    })
    drawText(String(item.quantity), colQtyX, y, { size: 10 })
    drawText(money(item.price), colPriceX, y, { size: 10, align: 'right' })
    drawText(money(item.price * item.quantity), colTotalX, y, { font: fontBold, size: 10, align: 'right' })

    variantLines.forEach((line, index) => {
      drawText(line, colProductX, y - nameHeight - index * 12.5, { size: 8.5, color: MUTED })
    })

    y -= nameHeight + variantHeight + 6
    drawLine(MARGIN, y + 8, PAGE_WIDTH - MARGIN, LINE, 0.75)
  }

  y -= 10

  // ---------- Totals ----------
  ensureSpace(140)
  const totalsX = PAGE_WIDTH - MARGIN - 200
  const totalsValueX = PAGE_WIDTH - MARGIN

  const totalsRow = (label: string, value: string, opts: { bold?: boolean; size?: number; color?: RGB } = {}) => {
    const font = opts.bold ? fontBold : fontRegular
    const size = opts.size ?? 10
    const labelLines = wrapText(label, totalsValueX - totalsX - font.widthOfTextAtSize(value, size) - 12, font, size)
    labelLines.forEach((line, index) => drawText(line, totalsX, y - index * (size + 4), { font, size, color: opts.color ?? MUTED }))
    drawText(value, totalsValueX, y, {
      font: opts.bold ? fontBold : fontRegular,
      size: opts.size ?? 10,
      color: opts.color ?? INK,
      align: 'right',
    })
    y -= Math.max(18, labelLines.length * (size + 4))
  }

  totalsRow('Subtotal', money(order.subtotal))
  totalsRow('Shipping', order.shipping === 0 ? 'FREE' : money(order.shipping))
  totalsRow('Tax', money(order.tax))
  if (order.discountAmount && order.discountAmount > 0) {
    totalsRow(`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`, `-${money(order.discountAmount)}`, {
      color: rgb(0.1, 0.5, 0.3),
    })
  }

  drawLine(totalsX, y + 6, totalsValueX, LINE)
  y -= 8

  totalsRow(options.standalone ? 'TOTAL' : 'TOTAL PAID', money(order.total), { bold: true, size: 13, color: INK })

  // ---------- Footer ----------
  const footerY = 70
  drawLine(MARGIN, footerY + 30, PAGE_WIDTH - MARGIN, LINE)
  drawText(
    'This is a computer-generated invoice and does not require a signature.',
    MARGIN,
    footerY + 14,
    { size: 8.5, color: MUTED }
  )
  drawText(
    `Questions about this ${options.standalone ? 'invoice' : 'order'}? Contact info@jacketee.com`,
    MARGIN,
    footerY,
    { size: 8.5, color: MUTED }
  )
  drawText(`Generated on ${formatDate(new Date())}`, PAGE_WIDTH - MARGIN, footerY, {
    size: 8.5,
    color: MUTED,
    align: 'right',
  })

  return pdfDoc.save()
}
