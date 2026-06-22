import mongoose from 'mongoose'
import Category from '../src/models/Category'
import Product from '../src/models/Product'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxe-store'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await Category.deleteMany({})
    await Product.deleteMany({})
    console.log('Cleared existing data')

    // Create categories
    const categories = await Category.create([
      {
        name: 'Tops',
        slug: 'tops',
        description: 'Premium tops, t-shirts, blouses, and more',
      },
      {
        name: 'Bottoms',
        slug: 'bottoms',
        description: 'Stylish pants, jeans, shorts, and skirts',
      },
      {
        name: 'Activewear',
        slug: 'activewear',
        description: 'Performance athletic wear for every activity',
      },
      {
        name: 'Outerwear',
        slug: 'outerwear',
        description: 'Jackets, coats, and hoodies for all seasons',
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        description: 'Sneakers, boots, and athletic shoes',
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Bags, hats, belts, and fashion accessories',
      },
    ])

    console.log('Created categories:', categories.length)

    // Create products (fashion/sports/outdoors only)
    const products = [
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-tshirt',
        description: 'Crafted from 100% organic cotton, this premium t-shirt offers superior comfort and breathability. Features a modern fit that works for any occasion.',
        price: 39.99,
        compareAtPrice: 59.99,
        categoryId: categories[0]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop', alt: 'Premium T-Shirt', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'XL', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'White', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Classic Denim Jeans',
        slug: 'classic-denim-jeans',
        description: 'Timeless style meets modern comfort. These classic straight-leg jeans feature premium stretch denim for all-day wear.',
        price: 79.99,
        compareAtPrice: 99.99,
        categoryId: categories[1]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop', alt: 'Denim Jeans', order: 0 },
        ],
        variants: [
          { name: 'Size', value: '30', priceAdjust: 0, inStock: true },
          { name: 'Size', value: '32', priceAdjust: 0, inStock: true },
          { name: 'Size', value: '34', priceAdjust: 0, inStock: true },
          { name: 'Size', value: '36', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Dark Blue', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Medium Blue', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Performance Running Shorts',
        slug: 'performance-running-shorts',
        description: 'Engineered for runners, these lightweight shorts feature moisture-wicking fabric, built-in liner, and reflective details for night runs.',
        price: 54.99,
        compareAtPrice: 74.99,
        categoryId: categories[2]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1556906781-9a412961d289?w=600&h=600&fit=crop', alt: 'Running Shorts', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Electric Blue', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Lightweight Down Jacket',
        slug: 'lightweight-down-jacket',
        description: 'Stay warm without the bulk. This premium down jacket features 800-fill power down, water-resistant shell, and packs into its own pocket.',
        price: 249.99,
        compareAtPrice: 349.99,
        categoryId: categories[3]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop', alt: 'Down Jacket', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Trail Running Shoes',
        slug: 'trail-running-shoes',
        description: 'Conquer any terrain with these high-performance trail running shoes. Features aggressive tread, rock plate protection, and responsive cushioning.',
        price: 159.99,
        compareAtPrice: 199.99,
        categoryId: categories[4]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop', alt: 'Trail Running Shoes', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'US 8', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 9', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 10', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 11', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Grey/Orange', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black/Red', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Designer Tote Bag',
        slug: 'designer-tote-bag',
        description: 'Elegant and spacious, this designer tote bag is perfect for work or weekends. Made from premium vegan leather with multiple compartments.',
        price: 129.99,
        compareAtPrice: 179.99,
        categoryId: categories[5]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop', alt: 'Tote Bag', order: 0 },
        ],
        variants: [
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Brown', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Compression Leggings',
        slug: 'compression-leggings',
        description: 'Maximum performance with ultimate comfort. These compression leggings feature moisture-wicking fabric, four-way stretch, and a high-waisted design.',
        price: 64.99,
        compareAtPrice: 84.99,
        categoryId: categories[2]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=600&h=600&fit=crop', alt: 'Compression Leggings', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'XS', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Classic Oxford Shirt',
        slug: 'classic-oxford-shirt',
        description: 'A wardrobe essential. This premium Oxford shirt features a relaxed fit, button-down collar, and soft cotton fabric.',
        price: 69.99,
        compareAtPrice: null,
        categoryId: categories[0]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop', alt: 'Oxford Shirt', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'White', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Light Blue', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Athletic Hoodie',
        slug: 'athletic-hoodie',
        description: 'Stay comfortable during workouts and beyond. This premium hoodie features moisture-wicking fleece, adjustable hood, and kangaroo pocket.',
        price: 84.99,
        compareAtPrice: 109.99,
        categoryId: categories[2]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop', alt: 'Athletic Hoodie', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'XL', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Grey', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Leather Belt',
        slug: 'leather-belt',
        description: 'Complete your look with this premium leather belt. Features genuine leather, brushed metal buckle, and adjustable sizing.',
        price: 44.99,
        compareAtPrice: 59.99,
        categoryId: categories[5]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&h=600&fit=crop', alt: 'Leather Belt', order: 0 },
        ],
        variants: [
          { name: 'Size', value: '36"', priceAdjust: 0, inStock: true },
          { name: 'Size', value: '40"', priceAdjust: 0, inStock: true },
          { name: 'Size', value: '44"', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Brown', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Hiking Boots',
        slug: 'hiking-boots',
        description: 'Tackle any trail with confidence. These waterproof hiking boots feature durable construction, excellent traction, and all-day comfort.',
        price: 189.99,
        compareAtPrice: 249.99,
        categoryId: categories[4]._id,
        isFeatured: true,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=600&h=600&fit=crop', alt: 'Hiking Boots', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'US 8', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 9', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 10', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'US 11', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Brown', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Wool Blend Coat',
        slug: 'wool-blend-coat',
        description: 'Elegant warmth for cold weather. This premium wool blend coat features a classic silhouette, notched lapels, and deep pockets.',
        price: 299.99,
        compareAtPrice: 399.99,
        categoryId: categories[3]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=600&fit=crop', alt: 'Wool Blend Coat', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Camel', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Sports Cap',
        slug: 'sports-cap',
        description: 'Stay cool and stylish. This performance cap features moisture-wicking fabric, adjustable strap, and UV protection.',
        price: 29.99,
        compareAtPrice: 39.99,
        categoryId: categories[5]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop', alt: 'Sports Cap', order: 0 },
        ],
        variants: [
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Grey', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Performance Polo Shirt',
        slug: 'performance-polo-shirt',
        description: 'Classic style meets modern performance. This polo shirt features moisture-wicking fabric, anti-odor technology, and a comfortable fit.',
        price: 54.99,
        compareAtPrice: 74.99,
        categoryId: categories[0]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1625910513413-5fc4e5e39f0f?w=600&h=600&fit=crop', alt: 'Performance Polo Shirt', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'White', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
        ],
      },
      {
        name: 'Yoga Pants',
        slug: 'yoga-pants',
        description: 'Perfect for yoga and everyday wear. These comfortable pants feature soft fabric, four-way stretch, and a flattering high waist.',
        price: 59.99,
        compareAtPrice: 79.99,
        categoryId: categories[2]._id,
        isFeatured: false,
        inStock: true,
        images: [
          { url: 'https://images.unsplash.com/photo-1582296335960-9e0216d0cbde?w=600&h=600&fit=crop', alt: 'Yoga Pants', order: 0 },
        ],
        variants: [
          { name: 'Size', value: 'XS', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'S', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'M', priceAdjust: 0, inStock: true },
          { name: 'Size', value: 'L', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Black', priceAdjust: 0, inStock: true },
          { name: 'Color', value: 'Navy', priceAdjust: 0, inStock: true },
        ],
      },
    ]

    const createdProducts = await Product.create(products)
    console.log('Created products:', createdProducts.length)

    console.log('\n✅ Database seeded successfully!')
    console.log(`Categories: ${categories.length}`)
    console.log(`Products: ${createdProducts.length}`)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

seed()