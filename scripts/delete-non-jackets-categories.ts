import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '@/models/Category'
import Product from '@/models/Product'

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!)

  const all = await Category.find().lean()

  // Find the Jackets tree (jackets + all descendants) - keep these, delete everything else.
  const jackets = all.find((c: any) => c.slug === 'jackets')
  const keepIds = new Set<string>()
  if (jackets) {
    const queue: string[] = [String(jackets._id)]
    while (queue.length) {
      const id = queue.shift()!
      keepIds.add(id)
      for (const c of all) {
        if (c.parentId && String(c.parentId) === id) queue.push(String(c._id))
      }
    }
  }

  const toDelete = all.filter((c: any) => !keepIds.has(String(c._id)))
  const toDeleteIds = toDelete.map((c: any) => String(c._id))

  console.log(`Keeping ${keepIds.size} Jackets-tree categories.`)
  console.log(`Deleting ${toDelete.length} other categories and their products...`)

  const productResult = await Product.deleteMany({ categoryId: { $in: toDeleteIds } })
  console.log(`  - Deleted ${productResult.deletedCount} products`)

  // Delete bottom-up (children before parents) to be safe, even though the
  // product blocker is now gone.
  let remaining = toDelete
  let progress = true
  while (remaining.length > 0 && progress) {
    progress = false
    const stillHere: any[] = []
    for (const cat of remaining) {
      const id = String(cat._id)
      const hasRemainingChild = remaining.some(
        (c: any) => c.parentId && String(c.parentId) === id && String(c._id) !== id
      )
      if (hasRemainingChild) {
        stillHere.push(cat)
        continue
      }
      await Category.findByIdAndDelete(id)
      console.log(`  - Deleted category: ${cat.name}`)
      progress = true
    }
    remaining = stillHere
  }

  if (remaining.length > 0) {
    console.log(`  ⚠ Could not delete (unexpected): ${remaining.map((c: any) => c.name).join(', ')}`)
  }

  console.log('✅ Done.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
