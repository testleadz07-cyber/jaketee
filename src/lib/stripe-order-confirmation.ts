import type Stripe from 'stripe'
import Order from '@/models/Order'
import Product from '@/models/Product'
import Discount from '@/models/Discount'
import { connectDB } from '@/lib/mongodb'
import { getOrderPaymentStatus } from '@/lib/order-payment-status'
import { applyStripeShippingAddress } from '@/lib/stripe-shipping-address'
import { getGarmentCategory } from '@/lib/garment-template'
import { VARSITY_TEMPLATE_ID } from '@/lib/varsity-template'
import { invalidateHomeCache } from '@/lib/home-cache'
import { notifyOrder } from '@/lib/notifications'
import { sendEmail, orderConfirmationTemplate } from '@/lib/email'

// Both signed webhooks and authenticated/session-bound verification use this
// transaction. Payment, stock and coupon counters commit together or roll back.
export async function confirmStripeOrder(checkout: Stripe.Checkout.Session) {
  if (checkout.payment_status !== 'paid') throw new Error('Payment is not paid')
  if (!await connectDB()) throw new Error('Database unavailable')
  const orderId = checkout.metadata?.orderId
  if (!orderId || checkout.client_reference_id !== orderId) throw new Error('Payment reference mismatch')
  let stockChanged = false
  const transaction = await Order.db.startSession()
  try {
    await transaction.withTransaction(async () => {
      stockChanged = false
      const order = await Order.findById(orderId).session(transaction)
      if (!order || order.paymentMethod !== 'stripe' || order.paymentId !== checkout.id) {
        throw new Error('Payment does not match order')
      }
      if (checkout.currency !== 'usd' || checkout.amount_total !== Math.round(order.total * 100)) {
        throw new Error('Payment amount mismatch')
      }
      if (getOrderPaymentStatus(order) === 'paid') {
        if (order.paymentStatus !== 'paid') { order.paymentStatus = 'paid'; await order.save({ session: transaction }) }
        return
      }
      applyStripeShippingAddress(order, checkout)
      order.paymentStatus = 'paid'
      if (order.status === 'pending' || order.status === 'cancelled') order.status = 'paid'
      order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Confirmed by Stripe' })
      // A pending marker is committed with payment. An ambiguous email attempt
      // is never automatically resent, avoiding duplicate messages after a crash.
      order.set('stripeConfirmationEmailStatus', 'pending')
      await order.save({ session: transaction })
      for (const item of order.items) {
        const quantity = Number(item.quantity)
        if (!item.productId || item.productId === VARSITY_TEMPLATE_ID || getGarmentCategory(item.productId) || quantity <= 0) continue
        const product = await Product.findByIdAndUpdate(item.productId,
          { $inc: { stockCount: -quantity } }, { session: transaction, returnDocument: 'after' })
        if (product) stockChanged = true
        if (product && product.stockCount <= 0) {
          await Product.findByIdAndUpdate(item.productId,
            { $set: { stockCount: 0, inStock: false } }, { session: transaction })
        }
      }
      if (order.promoCode) await Discount.findOneAndUpdate(
        { code: order.promoCode }, { $inc: { usageCount: 1 } }, { session: transaction })
    }, { maxCommitTimeMS: 5000, timeoutMS: 20000 })
  } finally { await transaction.endSession() }

  // Claim the single email attempt atomically. No network calls inside a DB
  // transaction: MongoDB may retry its callback after a concurrent write.
  const emailOrder = await Order.findOneAndUpdate(
    { _id: orderId, stripeConfirmationEmailStatus: 'pending' },
    { $set: { stripeConfirmationEmailStatus: 'sending' } }, { returnDocument: 'before' })
  // Sending remains uncertain if the process dies; never claim delivered.
  if (emailOrder) {
    try {
      const result = await sendEmail({
        to: emailOrder.userEmail,
        subject: `Jacketee - Order Confirmation #${emailOrder.orderNumber}`,
        html: orderConfirmationTemplate({
          orderNumber: emailOrder.orderNumber, userName: emailOrder.userName,
          items: emailOrder.items.map(item => ({ name: item.name, quantity: item.quantity,
            price: item.price, variant: item.variants?.[0] || { name: 'Standard', value: 'Default' },
            customization: item.customization })),
          total: emailOrder.total, shippingAddress: emailOrder.shippingAddress,
        }),
      })
      await Order.updateOne({ _id: orderId },
        { $set: { stripeConfirmationEmailStatus: result.success ? 'accepted' : 'failed' } })
    } catch { console.error('Stripe confirmation email was not accepted') }
  }
  try { if (stockChanged) await invalidateHomeCache() } catch { console.error('Stripe cache invalidation failed') }
  const order = await Order.findById(orderId)
  try { if (order) await notifyOrder(order, true) } catch { console.error('Stripe paid notification failed') }
  return order
}
