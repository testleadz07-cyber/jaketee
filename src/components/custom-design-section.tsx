import { publicRead } from '@/lib/public-cache'
import { getPublicCategories } from '@/lib/public-catalog'
import { CustomDesignCollection } from '@/components/custom-design-collection'
import { HomeDesignPreview } from '@/components/home-design-preview'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import { resolveDescendantIds } from '@/lib/categories'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/custom-design-images.json'
import { unstable_cache } from 'next/cache'

const getHomeDesignImages = unstable_cache(async () => {
  if (!await connectDB()) throw new Error('Homepage design images unavailable')
  const images: Record<string, { url: string; alt: string }> = Object.fromEntries(savedImages.map(image => [image.key, image]))
  const stored = await SectionImage.find({ section: 'home-custom-design' }).select('key url alt -_id').lean()
  for (const image of stored) if (typeof image.url === 'string' && image.url.trim()) images[image.key] = { url: image.url.trim(), alt: image.alt }
  return images
}, ['home-custom-design-images-v1'], { revalidate: 3600, tags: ['homepage-images'] })

export async function getCustomDesignImages() {
  try { return await getHomeDesignImages() }
  catch { return Object.fromEntries(savedImages.map(image => [image.key, image])) as Record<string, { url: string; alt: string }> }
}

export async function CustomDesignSection({ categorySlugs = [], home = false }: { categorySlugs?: string[]; home?: boolean } = {}) {
  const images = home
    ? await getHomeDesignImages().catch(() => Object.fromEntries(savedImages.map(image => [image.key, image])))
    : await getCustomDesignImages()
  if (home) return <HomeDesignPreview images={images} />
  let categoryName: string | undefined
  let categoryImages: string[] = []
  if (categorySlugs.length) {
    try {
      if (await connectDB()) {
        const categories = await getPublicCategories()
        const current = categories.find(item => item.slug === categorySlugs.at(-1))
        if (current) {
          categoryName = current.name
          const ids = resolveDescendantIds(categories.map(item => ({ _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null })), String(current._id))
          const products = await publicRead('collection-design-products', ids, 60, ['public-products'], async () => Product.find({ categoryId: { $in: ids }, isDraft: { $ne: true }, status: 'active', inStock: true }).select('images').sort({ isFeatured: -1, createdAt: -1, _id: 1 }).lean())
          categoryImages = [...new Set([...products.flatMap(item => (item.images || []).map((image: { url: string }) => image.url)), current.image || ''].filter((url): url is string => typeof url === 'string' && Boolean(url.trim())))]
        }
      }
    } catch (error) { console.error('Unable to load collection design images', error) }
  }
  return <CustomDesignCollection images={images} categorySlugs={categorySlugs} categoryName={categoryName} categoryImages={categoryImages} />
}
