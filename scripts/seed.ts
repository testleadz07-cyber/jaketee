import 'dotenv/config'
import mongoose from 'mongoose'
import { hashPassword } from '@/lib/auth'
import Category from '@/models/Category'
import Product from '@/models/Product'
import User from '@/models/User'
import { connectDB } from '@/lib/mongodb'
import { CATEGORIES } from '@/data/categories'
import { PRODUCTS } from '@/data/products'

async function seed() {
  console.log('🌱 Seeding database...')

  await mongoose.connect(process.env.MONGODB_URI!)

  // Clear existing data
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ])
  console.log('✅ Cleared existing data')

  // Seed categories
  const categoryMap: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const created = await Category.create({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
    })
    categoryMap[cat._id] = String(created._id)
    console.log(`  📁 Category: ${cat.name}`)
  }

  // Seed products
  for (const prod of PRODUCTS) {
    const categoryId = categoryMap[prod.categoryId]
    if (!categoryId) {
      console.warn(`  ⚠️  Skipping ${prod.name} - no matching category`)
      continue
    }

    await Product.create({
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || undefined,
      categoryId,
      images: prod.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        order: img.order,
      })),
      variants: prod.variants.map((v) => ({
        name: v.name,
        value: v.value,
        priceAdjust: v.priceAdjust,
        inStock: v.inStock,
      })),
      isFeatured: prod.isFeatured,
      inStock: prod.inStock,
      stockCount: 100,
      averageRating: 0,
      reviewCount: 0,
    })
    console.log(`  🛍️  Product: ${prod.name}`)
  }

  // Seed admin user
  const adminPassword = await hashPassword('admin123')
  await User.create({
    name: 'Admin User',
    email: 'admin@luxestore.com',
    password: adminPassword,
    role: 'admin',
    addresses: [],
  })
  console.log('  👤 Admin user: admin@luxestore.com / admin123')

  // Seed demo customer
  const custPassword = await hashPassword('customer123')
  await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: custPassword,
    role: 'customer',
    phone: '+1 (555) 000-0000',
    addresses: [
      {
        label: 'Home',
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        isDefault: true,
      },
    ],
  })
  console.log('  👤 Demo customer: john@example.com / customer123')

  console.log('\n🎉 Seeding complete!')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(async (err) => {
  console.error('❌ Seed error:', err)
  await mongoose.disconnect()
  process.exit(1)
})