import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest tech gadgets and accessories',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Trendy clothing and accessories',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Beautiful items for your home',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Gear for active lifestyles',
      },
    }),
  ])

  // Create products with variants and images
  const products = [
    {
      name: 'Wireless Noise-Canceling Headphones',
      slug: 'wireless-noise-canceling-headphones',
      description: 'Immerse yourself in premium audio with our advanced noise-canceling technology. These wireless headphones deliver exceptional sound quality, 30-hour battery life, and supreme comfort for all-day listening.',
      price: 299.99,
      compareAtPrice: 399.99,
      categoryId: categories[0].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Black', inStock: true },
        { name: 'Color', value: 'Silver', inStock: true },
      ],
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Stay connected and track your fitness with the ultimate smartwatch. Features include heart rate monitoring, GPS, water resistance, and a stunning AMOLED display.',
      price: 449.99,
      compareAtPrice: 549.99,
      categoryId: categories[0].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Space Gray', inStock: true },
        { name: 'Color', value: 'Silver', inStock: false },
      ],
    },
    {
      name: 'Vintage Leather Jacket',
      slug: 'vintage-leather-jacket',
      description: 'Timeless style meets modern comfort. This premium leather jacket features a classic cut, durable construction, and butter-soft leather that gets better with age.',
      price: 349.99,
      compareAtPrice: null,
      categoryId: categories[1].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Size', value: 'S', inStock: true },
        { name: 'Size', value: 'M', inStock: true },
        { name: 'Size', value: 'L', inStock: true },
        { name: 'Size', value: 'XL', inStock: false },
      ],
    },
    {
      name: 'Minimalist Desk Lamp',
      slug: 'minimalist-desk-lamp',
      description: 'Elevate your workspace with this sleek, modern desk lamp. Adjustable brightness, touch controls, and a warm LED glow create the perfect lighting for any task.',
      price: 89.99,
      compareAtPrice: 119.99,
      categoryId: categories[2].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'White', inStock: true },
        { name: 'Color', value: 'Black', inStock: true },
      ],
    },
    {
      name: 'Premium Yoga Mat',
      slug: 'premium-yoga-mat',
      description: 'Enhance your practice with our premium eco-friendly yoga mat. Extra thick for joint protection, non-slip surface, and beautiful gradient designs.',
      price: 59.99,
      compareAtPrice: 79.99,
      categoryId: categories[3].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Ocean Blue', inStock: true },
        { name: 'Color', value: 'Sunset Orange', inStock: true },
      ],
    },
    {
      name: 'Wireless Earbuds Elite',
      slug: 'wireless-earbuds-elite',
      description: 'Premium sound in a compact package. Active noise cancellation, transparency mode, and 24-hour battery life with the charging case.',
      price: 199.99,
      compareAtPrice: 249.99,
      categoryId: categories[0].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'White', inStock: true },
        { name: 'Color', value: 'Black', inStock: true },
      ],
    },
    {
      name: 'Designer Tote Bag',
      slug: 'designer-tote-bag',
      description: 'Stylish and spacious, this designer tote bag is perfect for work or weekends. Premium materials, multiple compartments, and timeless design.',
      price: 149.99,
      compareAtPrice: 199.99,
      categoryId: categories[1].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Beige', inStock: true },
        { name: 'Color', value: 'Black', inStock: true },
      ],
    },
    {
      name: 'Smart Plant Pot',
      slug: 'smart-plant-pot',
      description: 'Never forget to water your plants again. This smart pot monitors soil moisture, sunlight, and temperature, and reminds you when your plants need care.',
      price: 79.99,
      compareAtPrice: null,
      categoryId: categories[2].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'White', inStock: true },
        { name: 'Color', value: 'Terracotta', inStock: true },
      ],
    },
    {
      name: 'Running Shoes Elite',
      slug: 'running-shoes-elite',
      description: 'Engineered for performance, designed for comfort. Ultra-lightweight, responsive cushioning, and breathable mesh make these the perfect running companion.',
      price: 179.99,
      compareAtPrice: 219.99,
      categoryId: categories[3].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Size', value: 'US 8', inStock: true },
        { name: 'Size', value: 'US 9', inStock: true },
        { name: 'Size', value: 'US 10', inStock: true },
        { name: 'Size', value: 'US 11', inStock: false },
      ],
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: 'Take your music anywhere. Waterproof, dustproof, and drop-resistant with 360° sound and 20-hour battery life.',
      price: 129.99,
      compareAtPrice: 169.99,
      categoryId: categories[0].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Blue', inStock: true },
        { name: 'Color', value: 'Red', inStock: true },
      ],
    },
    {
      name: 'Artisan Coffee Table',
      slug: 'artisan-coffee-table',
      description: 'Handcrafted from solid wood, this artisan coffee table adds warmth and character to any living space. Natural finish, sturdy construction.',
      price: 599.99,
      compareAtPrice: 799.99,
      categoryId: categories[2].id,
      isFeatured: true,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Finish', value: 'Natural Oak', inStock: true },
        { name: 'Finish', value: 'Dark Walnut', inStock: true },
      ],
    },
    {
      name: 'Performance Backpack',
      slug: 'performance-backpack',
      description: 'Built for adventure and ready for work. Water-resistant, ergonomic design, multiple compartments, and built-in USB charging port.',
      price: 89.99,
      compareAtPrice: 119.99,
      categoryId: categories[3].id,
      isFeatured: false,
      inStock: true,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
      ],
      variants: [
        { name: 'Color', value: 'Black', inStock: true },
        { name: 'Color', value: 'Gray', inStock: true },
      ],
    },
  ]

  // Create products
  for (const productData of products) {
    const { images, variants, ...productInfo } = productData

    const product = await prisma.product.create({
      data: productInfo,
    })

    // Create images
    await Promise.all(
      images.map((url, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            url,
            alt: `${product.name} - View ${index + 1}`,
            order: index,
          },
        })
      )
    )

    // Create variants
    await Promise.all(
      variants.map((variant) =>
        prisma.productVariant.create({
          data: {
            productId: product.id,
            name: variant.name,
            value: variant.value,
            inStock: variant.inStock,
          },
        })
      )
    )
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })