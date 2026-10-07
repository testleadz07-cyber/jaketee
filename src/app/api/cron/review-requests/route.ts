import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { sendEmail, reviewRequestTemplate } from '@/lib/email'
import Order from '@/models/Order'
import Product from '@/models/Product'
import StoreSettings from '@/models/StoreSettings'
import mongoose from 'mongoose'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const CLAIM_TIMEOUT_MS = 30 * 60 * 1000

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : request.headers.get('x-cron-secret')
  return provided === secret
}

function getDeliveredAt(order: any): Date | null {
  if (order.deliveredAt) return new Date(order.deliveredAt)
  const event = [...(order.statusHistory || [])].reverse().find((entry: any) => entry.status === 'delivered')
  return event?.timestamp ? new Date(event.timestamp) : null
}

export async function GET(request: NextRequest) {
  return runReviewRequestSweep(request)
}

export async function POST(request: NextRequest) {
  return runReviewRequestSweep(request)
}

async function runReviewRequestSweep(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await connectDB()
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
  }

  const settings = await StoreSettings.findOne().lean()
  const delayDays = settings?.reviewRequestDelayDays ?? 7
  const now = new Date()
  const eligibleBefore = new Date(now.getTime() - delayDays * 24 * 60 * 60 * 1000)
  const staleClaimBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS)
  const candidates = await Order.find({
    status: 'delivered',
    reviewRequestSentAt: { $exists: false },
    $or: [
      { reviewRequestClaimedAt: { $exists: false } },
      { reviewRequestClaimedAt: { $lte: staleClaimBefore } },
    ],
  }).limit(100)

  let emailsSent = 0
  let skipped = 0

  for (const candidate of candidates) {
    const deliveredAt = getDeliveredAt(candidate)
    if (!deliveredAt || deliveredAt > eligibleBefore) {
      skipped++
      continue
    }

    const claimed = await Order.findOneAndUpdate(
      {
        _id: candidate._id,
        reviewRequestSentAt: { $exists: false },
        $or: [
          { reviewRequestClaimedAt: { $exists: false } },
          { reviewRequestClaimedAt: { $lte: staleClaimBefore } },
        ],
      },
      { $set: { reviewRequestClaimedAt: now, deliveredAt } },
      { returnDocument: 'after' }
    )

    if (!claimed) {
      skipped++
      continue
    }

    const productIds = Array.from(new Set(claimed.items.map((item: any) => item.productId))).filter(id => mongoose.isValidObjectId(id))
    const products = await Product.find({ _id: { $in: productIds } }).select('name slug').lean()
    const productMap = new Map(products.map((product: any) => [String(product._id), product]))
    const reviewProducts = claimed.items.map((item: any) => {
      const product: any = productMap.get(String(item.productId))
      return {
        name: product?.name || item.name,
        reviewUrl: product?.slug ? `${APP_URL}/product/${product.slug}#reviews` : `${APP_URL}/shop`,
      }
    })

    const result = await sendEmail({
      to: claimed.userEmail,
      subject: `How was your Jacketee order ${claimed.orderNumber}?`,
      html: reviewRequestTemplate({
        userName: claimed.userName || 'there',
        orderNumber: claimed.orderNumber,
        products: reviewProducts,
      }),
    })

    if (result.success) {
      await Order.updateOne(
        { _id: claimed._id, reviewRequestClaimedAt: now },
        { $set: { reviewRequestSentAt: new Date() }, $unset: { reviewRequestClaimedAt: 1 } }
      )
      emailsSent++
    } else {
      await Order.updateOne(
        { _id: claimed._id, reviewRequestClaimedAt: now },
        { $unset: { reviewRequestClaimedAt: 1 } }
      )
      skipped++
    }
  }

  return NextResponse.json({ scanned: candidates.length, emailsSent, skipped, delayDays })
}
