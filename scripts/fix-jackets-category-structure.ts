import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '@/models/Category'

// Corrects the category taxonomy seeded earlier (scripts/seed-jackets-categories.ts)
// against Clothaa's real site structure (verified via their actual sitemap.xml):
// - There is no "Jackets" parent on Clothaa - the 7 jacket types are each top-level.
// - Two Varsity subcategory slugs were wrong: wool-and-leather -> wool-leather,
//   all-wool -> wool. Updated in place (not delete+recreate) to preserve any
//   existing product references.

const SLUG_FIXES: Record<string, { name: string; slug: string }> = {
  'wool-and-leather': { name: 'Wool & Leather', slug: 'wool-leather' },
  'all-wool': { name: 'All Wool', slug: 'wool' },
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!)

  const jackets = await Category.findOne({ slug: 'jackets' })
  if (jackets) {
    const children = await Category.find({ parentId: jackets._id })
    for (const child of children) {
      child.parentId = null
      await child.save()
      console.log(`  ↑ Re-parented to top-level: ${child.name}`)
    }
    await Category.findByIdAndDelete(jackets._id)
    console.log(`  - Deleted: Jackets`)
  } else {
    console.log('  (No "Jackets" category found - already fixed or never existed)')
  }

  for (const [oldSlug, fix] of Object.entries(SLUG_FIXES)) {
    const cat = await Category.findOne({ slug: oldSlug })
    if (cat) {
      cat.slug = fix.slug
      await cat.save()
      console.log(`  ~ Fixed slug: ${oldSlug} -> ${fix.slug} (${fix.name})`)
    } else {
      console.log(`  (No category with slug "${oldSlug}" found - already fixed or never existed)`)
    }
  }

  console.log('✅ Done.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
