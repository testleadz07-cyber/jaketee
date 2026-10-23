import { CustomDesignCollection } from '@/components/custom-design-collection'
import { HomeDesignPreview } from '@/components/home-design-preview'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { resolveDescendantIds } from '@/lib/categories'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/custom-design-images.json'

export async function getCustomDesignImages() {
  const images: Record<string, { url: string; alt: string }> = Object.fromEntries(savedImages.map(image => [image.key, image]))
  try {
    if (await connectDB()) {
      const stored = await SectionImage.find({ section: 'home-custom-design' }).select('key url alt -_id').lean()
      for (const image of stored) if (typeof image.url === 'string' && image.url.trim()) images[image.key] = { url: image.url.trim(), alt: image.alt }
    }
  } catch (error) {
    console.error('Unable to load custom design images', error)
  }

  return images
}

export async function CustomDesignSection({ categorySlugs = [], home = false }: { categorySlugs?: string[]; home?: boolean } = {}) {
  const images = await getCustomDesignImages()
  if (home) return <HomeDesignPreview images={images} />
  let categoryName: string | undefined
  let categoryImages: string[] = []
  if (categorySlugs.length) {
    try {
      if (await connectDB()) {
        const categories = await Category.find().select('name slug parentId image').lean()
        const current = categories.find(item => item.slug === categorySlugs.at(-1))
        if (current) {
          categoryName = current.name
          const ids = resolveDescendantIds(categories.map(item => ({ _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null })), String(current._id))
          const products = await Product.find({ categoryId: { $in: ids }, isDraft: { $ne: true }, status: 'active', inStock: true }).select('images').sort({ isFeatured: -1, createdAt: -1, _id: 1 }).lean()
          categoryImages = [...new Set([...products.flatMap(item => (item.images || []).map((image: { url: string }) => image.url)), current.image || ''].filter((url): url is string => typeof url === 'string' && Boolean(url.trim())))]
        }
      }
    } catch (error) { console.error('Unable to load collection design images', error) }
  }
  return <CustomDesignCollection images={images} categorySlugs={categorySlugs} categoryName={categoryName} categoryImages={categoryImages} />
}
