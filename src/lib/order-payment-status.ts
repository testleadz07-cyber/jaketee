type PaymentOrder = {
  status: string
  paymentStatus?: string
  paymentMethod?: string
  isCustomOrder?: boolean
  statusHistory?: Array<{ status: string }>
}

/** Older online payments recorded confirmation only in order progress. */
export function getOrderPaymentStatus(order: PaymentOrder): string {
  const confirmed = order.status === 'paid' || order.statusHistory?.some((entry) => entry.status === 'paid')
  if (!order.isCustomOrder && ['stripe', 'paypal'].includes(order.paymentMethod || '') && confirmed) return 'paid'
  return order.paymentStatus || (order.status === 'paid' ? 'paid' : 'unpaid')
}
