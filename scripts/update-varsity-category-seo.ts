import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '@/models/Category'

const VARSITY_CATEGORY_SEO: Record<string, { seoTitle: string; seoDescription?: string; heading: string }> = {
  'varsity-jackets': {
    seoTitle: 'Custom Varsity Jackets | Design Your Letterman Jacket | Jacketee',
    seoDescription: 'Shop custom varsity jackets in wool, leather, satin and more. Add chenille patches, names, numbers and embroidery. Individual and bulk team orders.',
    heading: 'Custom Varsity Jackets',
  },
  'wool-leather': {
    seoTitle: 'Custom Wool & Leather Varsity Jackets | Jacketee',
    heading: 'Custom Wool & Leather Varsity Jackets',
  },
  wool: {
    seoTitle: 'Custom All Wool Varsity Jackets | Jacketee',
    heading: 'Custom All Wool Varsity Jackets',
  },
  satin: {
    seoTitle: 'Custom Satin Varsity Jackets | Jacketee',
    heading: 'Custom Satin Varsity Jackets',
  },
  'faux-leather': {
    seoTitle: 'Custom Faux Leather Varsity Jackets | Jacketee',
    heading: 'Custom Faux Leather Varsity Jackets',
  },
  'all-leather': {
    seoTitle: 'Custom All Leather Varsity Jackets | Jacketee',
    heading: 'Custom All Leather Varsity Jackets',
  },
  hooded: {
    seoTitle: 'Custom Hooded Varsity Jackets | Jacketee',
    heading: 'Custom Hooded Varsity Jackets',
  },
  retro: {
    seoTitle: 'Custom Retro Varsity Jackets | Jacketee',
    heading: 'Custom Retro Varsity Jackets',
  },
  fleece: {
    seoTitle: 'Custom Fleece Varsity Jackets | Jacketee',
    heading: 'Custom Fleece Varsity Jackets',
  },
  'cotton-twill': {
    seoTitle: 'Custom Cotton Twill Varsity Jackets | Jacketee',
    heading: 'Custom Cotton Twill Varsity Jackets',
  },
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required')
  }

  await mongoose.connect(process.env.MONGODB_URI)

  for (const [slug, fields] of Object.entries(VARSITY_CATEGORY_SEO)) {
    const result = await Category.findOneAndUpdate(
      { slug },
      { $set: fields },
      { new: true }
    )

    if (result) {
      console.log(`Updated ${slug}`)
    } else {
      console.warn(`No category found for ${slug}`)
    }
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('Failed to update varsity category SEO:', error)
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
