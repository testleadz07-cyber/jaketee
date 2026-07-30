import Product from '@/models/Product'

/**
 * Decrements stock for each item in a now-paid order. Never rejects - by the
 * time this runs the customer has already been charged, so the only options
 * are "sell it anyway and flag it" or "leave stock permanently wrong."
 */
export async function decrementStockForOrder(
  items: Array<{ productId: string; quantity: number }>
) {
  for (const item of items) {
    const quantity = Number(item.quantity) || 0
    if (!item.productId || quantity <= 0) continue

    const updated = await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stockCount: -quantity } },
      { new: true }
    )

    if (!updated) continue

    if (updated.stockCount <= 0) {
      await Product.findByIdAndUpdate(item.productId, {
        stockCount: Math.max(0, updated.stockCount),
        inStock: false,
      })
      if (updated.stockCount < 0) {
        console.error(
          `Oversold: product ${item.productId} went to ${updated.stockCount} after order fulfillment`
        )
      }
    }
  }
}
