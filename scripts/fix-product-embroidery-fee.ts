import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from '../src/lib/mongodb'
import Product from '../src/models/Product'

const PRODUCT_ID = '6a6b6228375bdd96c8c1625b'

async function run() {
  console.log('Connecting to database...')
  const db = await connectDB()
  if (!db) {
    console.error('Failed to connect to database')
    process.exit(1)
  }
  console.log('Connected!')

  const product = await Product.findById(PRODUCT_ID)
  if (!product) {
    console.error('Product not found:', PRODUCT_ID)
    process.exit(1)
  }

  console.log('Before:', JSON.stringify({
    name: product.name,
    embroidery: product.embroidery,
    measurementFields: product.measurementFields,
  }, null, 2))

  if (!product.embroidery) {
    console.error('Product has no embroidery field set at all.')
  } else {
    const normalizedFee = Math.round((product.embroidery.fee || 0) * 100) / 100
    product.embroidery.fee = normalizedFee
    await product.save()
  }

  const after = await Product.findById(PRODUCT_ID).lean()
  console.log('After:', JSON.stringify({
    name: after?.name,
    embroidery: after?.embroidery,
    measurementFields: after?.measurementFields,
  }, null, 2))

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
