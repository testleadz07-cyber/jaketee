import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Review from '@/models/Review'
import Faq from '@/models/Faq'
import { buildProductUrl, resolveAncestorChain, resolveDescendantIds } from '@/lib/categories'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const db = await connectDB()
    if (!db) return NextResponse.json({ faqs: [], reviewCount: 0, averageRating: 0, reviews: [] })

    const categories = await Category.find().lean()
    const nodes = categories.map((category: any) => ({
      _id: String(category._id),
      parentId: category.parentId ? String(category.parentId) : null,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    }))
    const current = nodes.find((category) => category.slug === slug)
    if (!current) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const chain = resolveAncestorChain(nodes, current._id)
    const children = nodes.filter((category) => category.parentId === current._id)
    const descendantIds = resolveDescendantIds(nodes, current._id)
    const targets = [
      ...chain.slice().reverse().flatMap((category) => {
        const path = chain.slice(0, chain.indexOf(category) + 1).map((item) => item.slug).join('/')
        return [category.slug, `/${category.slug}`, path, `/${path}`]
      }),
    ]

    const matchedFaqs = await Faq.find({ displayPages: { $in: targets } }).limit(40).lean()
    const faqs = matchedFaqs
      .sort((a: any, b: any) => {
        const rank = (faq: any) => Math.min(...faq.displayPages.map((page: string) => {
          const index = targets.indexOf(page)
          return index < 0 ? Number.MAX_SAFE_INTEGER : index
        }))
        return rank(a) - rank(b) || Number(a.order || 0) - Number(b.order || 0)
      })
      .map((faq: any) => ({
        id: String(faq._id),
        question: faq.question,
        answer: faq.answer || [],
        bullets: faq.bullets || [],
        ordered: faq.ordered || [],
      }))

    const fallback = [
      { question: `What is included in the ${current.name} collection?`, answer: current.description || `Browse the ${current.name} products shown above.`, href: '#category-products' },
      { question: `Which ${current.name} styles can I browse?`, answer: children.length ? `Explore ${children.map((child) => child.name).join(', ')} within this collection.` : 'Browse the product listings above for the available styles in this collection.', href: '#category-products' },
      { question: `How do I choose a size for ${current.name}?`, answer: 'Check the size options on each product page. For garment measurements, ask our team before ordering.', href: '/contact' },
      { question: `How can I compare materials and colors for ${current.name}?`, answer: 'The materials and colors guide explains the options. Confirm the available choices on the specific product page.', href: '/materials-colors' },
      { question: `Can I personalize a ${current.name} item?`, answer: 'Customization availability varies by product. Check its options and contact our team about a design that is not listed.', href: '/contact' },
      { question: `Where can I learn about patches and embroidery for ${current.name}?`, answer: 'Our patches and embroidery guide covers the available techniques and placement ideas. Confirm options on the product page.', href: '/patches-embroidery' },
      { question: `Can I order ${current.name} for a school or team?`, answer: 'For quantities, design coordination, and a quote, see our school and team bulk order information.', href: '/bulk-orders/schools' },
      { question: `How is ${current.name} shipping calculated?`, answer: 'Shipping options and charges depend on the order. Review the shipping page and the checkout total before placing your order.', href: '/shipping' },
      { question: `Can I return a customized ${current.name} item?`, answer: 'Personalized and custom items have return exclusions. Review the return policy before ordering.', href: '/returns' },
      { question: `Who can help me choose a ${current.name} product?`, answer: 'Contact our team with your size, preferred materials, colors, and any personalization needs.', href: '/contact' },
    ]
    const seen = new Set(faqs.map((faq: { question: string }) => faq.question.trim().toLowerCase()))
    for (const item of fallback) {
      if (faqs.length >= 10) break
      if (seen.has(item.question.toLowerCase())) continue
      seen.add(item.question.toLowerCase())
      faqs.push({ id: `guide-${faqs.length}`, question: item.question, answer: [item.answer], bullets: [], ordered: [], href: item.href } as any)
    }

    const products = await Product.find({ categoryId: { $in: descendantIds } }, '_id name slug categoryId').lean()
    const productIds = products.map((product: any) => product._id)
    let reviewCount = 0
    let averageRating = 0
    let reviews: Array<{ id: string; rating: number; title: string; comment: string; userName: string; productName: string; productHref: string }> = []

    if (productIds.length > 0) {
      const match = { productId: { $in: productIds }, status: 'approved' }
      const [summary, latest] = await Promise.all([
        Review.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
        Review.find(match).sort({ createdAt: -1 }).limit(2).lean(),
      ])
      reviewCount = Number(summary[0]?.count || 0)
      averageRating = Number(summary[0]?.average || 0)
      const productById = new Map(products.map((product: any) => [String(product._id), product]))
      reviews = latest.map((review: any) => {
        const product: any = productById.get(String(review.productId))
        const path = product ? resolveAncestorChain(nodes, String(product.categoryId)) : []
        return {
          id: String(review._id),
          rating: Number(review.rating),
          title: review.title || '',
          comment: review.comment,
          userName: review.userName,
          productName: product?.name || current.name,
          productHref: product ? buildProductUrl({ slug: product.slug, categoryPath: path }) : '#category-products',
        }
      })
    }

    return NextResponse.json({ faqs: faqs.slice(0, 10), reviewCount, averageRating, reviews })
  } catch (error) {
    console.error('Error loading category insights:', error)
    return NextResponse.json({ faqs: [], reviewCount: 0, averageRating: 0, reviews: [] }, { status: 500 })
  }
}

