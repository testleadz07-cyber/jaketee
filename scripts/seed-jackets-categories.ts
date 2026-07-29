import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '@/models/Category'

// Jackets taxonomy sourced from clothaa.com's live nav (see PRODUCTION_READINESS_CHECKLIST.md §8.1).
// Level 0: Jackets (new top-level parent)
// Level 1: 7 jacket types
// Level 2: material/style subcategories, only under Varsity Jackets (Clothaa's hero type)
const TAXONOMY = {
  name: 'Jackets',
  slug: 'jackets',
  description: 'Custom and ready-made jackets for every style.',
  children: [
    {
      name: 'Varsity Jackets',
      slug: 'varsity-jackets',
      description: 'Classic letterman-style varsity jackets.',
      children: [
        { name: 'Wool & Leather', slug: 'wool-and-leather', description: 'Classic wool body with leather sleeves.' },
        { name: 'All Wool', slug: 'all-wool', description: 'Warm melton wool body for school jackets.' },
        { name: 'Faux Leather', slug: 'faux-leather', description: 'Vegan leather sleeve construction.' },
        { name: 'All Leather', slug: 'all-leather', description: 'Full-leather build with a heavy feel.' },
        { name: 'Hooded', slug: 'hooded', description: 'Varsity jackets with an attached hood.' },
        { name: 'Retro', slug: 'retro', description: 'Vintage-inspired colorways and cuts.' },
        { name: 'Satin', slug: 'satin', description: 'Lightweight satin with a glossy finish.' },
        { name: 'Fleece', slug: 'fleece', description: 'Soft fleece-body varsity jackets.' },
        { name: 'Cotton Twill', slug: 'cotton-twill', description: 'Durable cotton twill construction.' },
      ],
    },
    { name: 'Bomber Jackets', slug: 'bomber-jackets', description: 'Classic MA-1 style bomber jackets.' },
    { name: 'Coach Jackets', slug: 'coach-jackets', description: 'Lightweight snap-button coach jackets.' },
    { name: 'Denim Jackets', slug: 'denim-jackets', description: 'Classic denim trucker jackets.' },
    { name: 'Fleece Hoodies', slug: 'fleece-hoodies', description: 'Warm fleece hoodies.' },
    { name: 'Leather Jackets', slug: 'leather-jackets', description: 'Premium leather and suede jackets.' },
    { name: 'Puffer Jackets', slug: 'puffer-jackets', description: 'Insulated puffer jackets.' },
  ],
}

async function upsertCategory(
  node: { name: string; slug: string; description?: string },
  parentId: string | null
) {
  let category = await Category.findOne({ slug: node.slug })
  if (category) {
    console.log(`  ↺ Exists, skipping: ${node.name}`)
  } else {
    category = await Category.create({
      name: node.name,
      slug: node.slug,
      description: node.description,
      parentId,
    })
    console.log(`  + Created: ${node.name}${parentId ? ' (subcategory)' : ''}`)
  }
  return String(category._id)
}

async function seedNode(node: any, parentId: string | null) {
  const id = await upsertCategory(node, parentId)
  for (const child of node.children || []) {
    await seedNode(child, id)
  }
}

async function main() {
  console.log('🧥 Seeding Jackets category taxonomy...')
  await mongoose.connect(process.env.MONGODB_URI!)
  await seedNode(TAXONOMY, null)
  console.log('✅ Done. Existing categories/products were not modified.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
