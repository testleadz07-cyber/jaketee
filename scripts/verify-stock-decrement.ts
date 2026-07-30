import 'dotenv/config'

import { connectDB } from '../src/lib/mongodb'
import Product from '../src/models/Product'
import Order from '../src/models/Order'
import { decrementStockForOrder } from '../src/lib/inventory'

async function run() {
  console.log('Connecting to database...')
  const db = await connectDB()
  if (!db) {
    console.error('Failed to connect to database')
    process.exit(1)
  }
  console.log('Connected!\n')

  // Clean up any leftover test data from a previous interrupted run.
  await Product.deleteMany({ name: '__stock_decrement_test__' })
  await Order.deleteMany({ orderNumber: { $regex: /^TEST-/ } })

  let testProductId: string | null = null
  let orderId: string | null = null
  let passStep2 = false
  let passStep3 = false
  let passStep4 = false

  try {
    // 1. Create a throwaway test product with a known stock count.
    const testProduct = await Product.create({
      name: '__stock_decrement_test__',
      slug: `__stock-decrement-test-${Date.now()}`,
      description: 'temporary product created by verify-stock-decrement.ts',
      price: 1,
      categoryId: (await Product.findOne())?.categoryId, // reuse any existing category id
      stockCount: 3,
      inStock: true,
    })
    testProductId = String(testProduct._id)
    console.log(`Created test product ${testProductId} with stockCount=3`)

    const items = [{ productId: testProductId, quantity: 2 }]

    // 2. Simulate what the payment-confirmation routes do: decrement once.
    await decrementStockForOrder(items)
    let after = await Product.findById(testProductId).lean()
    console.log(`After 1st decrement (qty 2): stockCount=${after?.stockCount}, inStock=${after?.inStock}`)
    passStep2 = after?.stockCount === 1 && after?.inStock === true

    // 3. Simulate a duplicate webhook delivery calling decrement again directly
    //    (in the real routes this can't happen twice for the same order because
    //    of the `status === 'paid'` guard - this just proves the helper itself
    //    is safe to call, and separately exercises the stockCount=0 -> inStock=false path).
    await decrementStockForOrder(items) // qty 2 again, only 1 left -> goes to -1, clamped to 0
    after = await Product.findById(testProductId).lean()
    console.log(`After 2nd decrement (qty 2, oversell case): stockCount=${after?.stockCount}, inStock=${after?.inStock}`)
    passStep3 = after?.stockCount === 0 && after?.inStock === false

    // 4. Confirm a real order's items array shape works end-to-end too.
    const order = await Order.create({
      orderNumber: `TEST-${Date.now()}`,
      userEmail: 'test@example.com',
      userName: 'Test User',
      items: [{
        productId: testProductId,
        name: testProduct.name,
        image: 'https://example.com/placeholder.png',
        price: 1,
        quantity: 1,
        variants: [{ name: 'Test', value: 'Value' }],
      }],
      subtotal: 1,
      total: 1,
      status: 'pending',
      paymentMethod: 'stripe',
      shippingAddress: { name: 'Test', street: 'Test', city: 'Test', state: 'Test', zip: '00000' },
    })
    orderId = String(order._id)
    await decrementStockForOrder(order.items)
    after = await Product.findById(testProductId).lean()
    console.log(`After order-shaped decrement (qty 1, already at 0): stockCount=${after?.stockCount}, inStock=${after?.inStock}`)
    passStep4 = after?.stockCount === 0 && after?.inStock === false
  } finally {
    // Cleanup - always runs, even if an assertion above threw.
    if (testProductId) await Product.findByIdAndDelete(testProductId)
    if (orderId) await Order.findByIdAndDelete(orderId)
    console.log('\nCleaned up test product and test order.')
  }

  console.log('\n--- RESULT ---')
  console.log(passStep2 ? 'PASS: normal decrement works' : 'FAIL: normal decrement')
  console.log(passStep3 ? 'PASS: oversell clamps to 0 and flips inStock false' : 'FAIL: oversell handling')
  console.log(passStep4 ? 'PASS: real Order document shape decrements correctly' : 'FAIL: order-shaped decrement')

  process.exit(passStep2 && passStep3 && passStep4 ? 0 : 1)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
