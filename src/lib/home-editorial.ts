import 'server-only'
import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'

export const getHomeReviews = unstable_cache(async () => {
  if (!await connectDB()) throw new Error('Homepage reviews unavailable')
    const reviews = await Review.find({ status: 'approved', rating: { $gte: 4 }, comment: { $ne: '' } })
      .select('productId userName rating comment images')
      .sort({ createdAt: -1 })
      .limit(24)
      .lean()

    if (!reviews.length) return []

    const products = await Product.find({ _id: { $in: reviews.map((review) => review.productId) }, inStock: true, isDraft: { $ne: true }, status: 'active' })
      .select('name slug categoryId')
      .lean()
    const productById = new Map(products.map((product) => [String(product._id), product]))
    const categories = await Category.find().select('name slug parentId').lean()
    const categoryNodes = categories.map((category) => ({
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ? String(category.parentId) : null,
    }))

    const highlights = reviews.flatMap((review) => {
      const product = productById.get(String(review.productId))
      if (!product?.slug) return []

      const categoryPath = product.categoryId
        ? resolveAncestorChain(categoryNodes, String(product.categoryId)).map((category) => ({ name: category.name, slug: category.slug }))
        : []

      return [{
        id: String(review._id),
        name: review.userName || 'Jacketee customer',
        rating: review.rating,
        comment: review.comment,
        image: review.images?.find((url) => /^https:\/\//.test(url)) || null,
        productName: product.name,
        productHref: buildProductUrl({ slug: product.slug, categoryPath }),
      }]
    })

    highlights.sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
    return highlights.slice(0, 3)
}, ['home-reviews-v1'], { revalidate: 300, tags: ['homepage-reviews'] })

const preferredArticles = [
  'hooded-varsity-jackets-guide',
  'corporate-away-day-uniforms-custom-jacket-vs-polo',
  'sports-teams-custom-jackets-award-nights-banquets',
]
export const getHomeArticles = unstable_cache(async () => {
  if (!await connectDB()) throw new Error('Homepage articles unavailable')
  // Keep the existing 24-post selection window and preferred-slug ordering.
  // Only the final three compact cards cross the rendering boundary.
  void BlogCategory.modelName
  const posts = await BlogPost.find({ $or: [
    { status: 'published' }, { status: 'scheduled', publishedAt: { $lte: new Date() } },
  ] }).select('title slug excerpt featuredImage tags taggedProducts categories').populate('categories', 'name slug')
    .sort({ publishedAt: -1 }).limit(24).lean()
  const needsFallback = posts.some(post => !post.featuredImage || post.featuredImage.includes('/placeholder.png') || post.featuredImage.includes('/_next/image?'))
  const candidates = needsFallback ? await getBlogImageCandidates() : []
  const usable = posts.map(post => ({
    id: String(post._id), title: post.title, slug: post.slug, excerpt: post.excerpt,
    featuredImage: resolveBlogImage(post, candidates),
  })).filter(post => /^https:\/\//.test(post.featuredImage || ''))
  const preferred = preferredArticles.flatMap(slug => usable.find(post => post.slug === slug) || [])
  return [...preferred, ...usable.filter(post => !preferred.some(item => item.id === post.id))].slice(0, 3)
}, ['home-articles-v1'], { revalidate: 300, tags: ['homepage-articles'] })
