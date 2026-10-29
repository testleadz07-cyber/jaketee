import 'server-only'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import RefundRequest from '@/models/RefundRequest'
import { returnSubmissionGate } from './return-submission-gate'

export interface ReturnInput { orderId: string; userEmail: string; userName: string; reason: string; turnstileToken: string }
export function parseReturnInput(value: unknown): ReturnInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid request')
  const body = value as Record<string, unknown>
  const allowed = ['orderId', 'userEmail', 'userName', 'reason', 'turnstileToken']
  if (Object.keys(body).some(key => !allowed.includes(key))) throw Error('Unexpected request fields')
  const text = (key: string, min: number, max: number) => {
    const raw = body[key] ?? ''
    if (typeof raw !== 'string' || raw.length > max) throw Error('Invalid ' + key)
    const result = raw.trim()
    if (result.length < min || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(result)) throw Error('Invalid ' + key)
    return result
  }
  const orderId = text('orderId', 1, 100)
  if (!/^[A-Za-z0-9_-]+$/.test(orderId)) throw Error('Invalid order number')
  const userEmail = text('userEmail', 0, 254).toLowerCase()
  if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) throw Error('Invalid email')
  return { orderId, userEmail, userName: text('userName', 0, 100), reason: text('reason', 10, 4000), turnstileToken: text('turnstileToken', 1, 2048) }
}

export async function submitReturn(input: ReturnInput, user?: { id?: string }) {
  if (!await connectDB()) return { status: 503, error: 'Returns are temporarily unavailable. Please try again.' }
  // The form accepts the customer-facing order NUMBER, not a MongoDB object ID.
  const order = await Order.findOne({ orderNumber: input.orderId }).select('_id orderNumber userId userEmail').lean()
  const ownsOrder = order && ((user?.id && String(order.userId || '') === user.id) ||
    (input.userEmail && input.userEmail === String(order.userEmail || '').trim().toLowerCase()))
  if (!ownsOrder || !order) return { status: 400, error: 'Unable to verify this return request. Check your order number and email.' }
  const canonical = String(order.orderNumber)
  // Include old records that may have stored the MongoDB ID instead of the number.
  const orderQuery = { orderId: { $in: [canonical, String(order._id)] } }
  if (await RefundRequest.exists({ ...orderQuery, status: 'pending' })) return { status: 409, error: 'A return request is already pending for this order.' }
  const recent = await RefundRequest.find({ ...orderQuery, createdAt: { $gt: new Date(Date.now() - 86400000) } }).select('_id').limit(3).lean()
  if (recent.length >= 3) return { status: 429, error: 'Please wait before submitting another request for this order.' }
  const claim = await returnSubmissionGate(String(order._id), 'returns-reserve', { settledIds: recent.map(row => String(row._id)) })
  if (claim.status !== 'reserved') return { status: claim.status === 'limited' ? 429 : 409, error: 'A request for this order is already being processed. Please try again later.' }
  // Recheck after reservation: another request might have committed while this
  // invocation waited for the DO. Expired reservations reuse the SAME Mongo _id.
  if (await RefundRequest.exists({ ...orderQuery, status: 'pending' })) return { status: 409, error: 'A return request is already pending for this order.' }
  const result = await RefundRequest.updateOne({ _id: claim.id }, {
    $setOnInsert: { orderId: canonical, reason: input.reason, status: 'pending', createdAt: new Date(), updatedAt: new Date() },
  }, { upsert: true, runValidators: true, setDefaultsOnInsert: true, timestamps: false })
  // Explicit timestamps belong only to the insert, not an idempotent retry.
  await returnSubmissionGate(String(order._id), 'returns-complete', { id: claim.id }).catch(() => {})
  return { status: 201, id: claim.id!, orderNumber: canonical, inserted: result.upsertedCount === 1 }
}
