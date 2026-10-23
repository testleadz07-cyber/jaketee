import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Review from '@/models/Review'
import Faq from '@/models/Faq'
import BlogPost from '@/models/BlogPost'
import '@/models/BlogCategory'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
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
    const isShop = slug === 'all'
    const current = isShop ? { _id: 'all', parentId: null, name: 'all products', slug: 'all', description: 'Browse jackets, hoodies, patches and embroidery.' } : nodes.find((category) => category.slug === slug)
    if (!current) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const chain = isShop ? [] : resolveAncestorChain(nodes, current._id)
    const children = nodes.filter((category) => category.parentId === current._id)
    const descendantIds = isShop ? nodes.map(item => item._id) : resolveDescendantIds(nodes, current._id)
    const targets = [
      ...(isShop ? ['shop', '/shop'] : []),
      ...chain.slice().reverse().flatMap((category) => {
        const path = chain.slice(0, chain.indexOf(category) + 1).map((item) => item.slug).join('/')
        return [category.slug, `/${category.slug}`, path, `/${path}`]
      }),
    ]

    const matchedFaqs = await Faq.find({ status: { $ne: 'draft' }, $or: [{ displayPages: { $in: targets } }, { category: { $in: chain.map(item => item.name) } }] }).limit(40).lean()
    const faqs = matchedFaqs
      .filter((faq: any) => faq.question?.trim() && [...(faq.answer || []), ...(faq.bullets || []), ...(faq.ordered || [])].some(text => text.trim()))
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
      { question: `How do I choose a size for ${current.name}?`, answer: chain.some(item => item.slug === 'patches-embroidery') ? 'Check the dimensions and placement options on the product page. Contact our team to confirm the size for your artwork.' : 'Check the size options on each product page. For garment measurements, ask our team before ordering.', href: '/contact' },
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

    const products = await Product.find({ categoryId: { $in: descendantIds }, isDraft: { $ne: true }, status: 'active' }, '_id name slug categoryId').lean()
    const productIds = products.map((product: any) => product._id)
    let reviewCount = 0
    let averageRating = 0
    let reviews: Array<{ id: string; rating: number; title: string; comment: string; userName: string; productName: string; productHref: string }> = []

    if (productIds.length > 0) {
      const match = { productId: { $in: productIds }, status: 'approved' }
      const [summary, latest] = await Promise.all([
        Review.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
        Review.find(match).sort({ createdAt: -1 }).limit(3).lean(),
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

    const [posts, imageCandidates] = await Promise.all([
      BlogPost.find({ status: 'published', $or: [{ publishedAt: { $lte: new Date() } }, { publishedAt: null }] }).select('title slug excerpt featuredImage categories tags taggedProducts publishedAt').populate('categories', 'name').sort({ publishedAt: -1, _id: 1 }).lean(),
      getBlogImageCandidates(),
    ])
    const productSet = new Set(productIds.map(id => String(id)))
    const aliases: Record<string, string[]> = { 'varsity-jackets': ['varsity', 'letterman'], 'fleece-hoodies': ['hoodie', 'fleece'], 'patches-embroidery': ['patch', 'embroidery', 'chenille'] }
    const scopes = chain.slice().reverse().map(item => [...new Set([item.name.toLowerCase(), item.slug.replace(/-/g, ' '), item.name.toLowerCase().replace(/jackets/g, 'jacket'), ...(aliases[item.slug] || []), ...item.name.toLowerCase().split(/[^a-z]+/).filter(word => word.length > 3 && !['jackets', 'jacket', 'leather', 'custom'].includes(word))])])
    const articles = posts.map(post => {
      const text = `${post.title} ${(post.tags || []).join(' ')} ${(post.categories || []).map((item: { name: string }) => item.name).join(' ')}`.toLowerCase()
      const tagged = (post.taggedProducts || []).some((id: unknown) => productSet.has(String(id)))
      const score = tagged ? 100 : isShop ? (/jacket|hoodie|patch|embroider|sizing|material|letterman/i.test(text) ? 1 : 0) : scopes.reduce((sum, terms, index) => sum + (terms.some(term => text.includes(term)) ? 20 / (index + 1) : 0), 0)
      return { post, score }
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(({ post }) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt || '', featuredImage: resolveBlogImage(post, imageCandidates), publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null, categories: (post.categories || []).map((item: { name: string }) => ({ name: item.name })) }))
    const essentials = [
      { question: `How do I choose the right size${isShop ? '' : ` for ${current.name}`}?`, answer: ['Check the measurements and size options on the product page, and use the size guide before ordering. Contact our team if you need help comparing sizes.'], href: '/size-guide' },
      { question: `Can I personalize ${isShop ? 'my order' : current.name}?`, answer: ['Available colors, lettering, names and artwork options vary by product. Review the product options or contact our team about your design.'], href: '/contact' },
      { question: 'Can I order a single item or a group order?', answer: ['Check the product page for available quantities and options. For a coordinated school, team or brand order, explore our bulk order information.'], href: '/bulk-orders' },
      { question: 'Where can I check production and delivery times?', answer: ['Check the product information and shipping guide for current details. Confirm the timing for your design and destination with our team before ordering.'], href: '/shipping' },
      { question: 'Can personalized products be returned?', answer: ['Personalized and custom products have return exclusions. Review the return policy before placing your order.'], href: '/returns' },
      { question: 'How do I compare materials and colors?', answer: ['Use the materials and colors guide, then confirm the available options and care details on the product page.'], href: '/materials-colors' },
    ]
    const purchaseFaqs = isShop ? [
      ...faqs.filter(item => !String(item.id).startsWith('guide-')),
      ...essentials.map((item, index) => ({ ...item, id: `shop-guide-${index}`, bullets: [], ordered: [] })),
    ].filter((item, index, all) => all.findIndex(other => other.question.toLowerCase() === item.question.toLowerCase()) === index).slice(0, 6) : [...faqs].sort((a, b) => { const rank = (question: string) => /baby|toddler|child|kids|parent/i.test(question) && !/baby|toddler|child|kids/i.test(current.name) ? 10 : /siz|fit/i.test(question) ? 0 : /material|color/i.test(question) ? 1 : /custom|personaliz|names|numbers/i.test(question) ? 2 : /ship|deliver/i.test(question) ? 3 : /return/i.test(question) ? 4 : 5; return rank(a.question) - rank(b.question) }).slice(0, 5)
    return NextResponse.json({ faqs: purchaseFaqs, reviewCount, averageRating, reviews, articles })
  } catch (error) {
    console.error('Error loading category insights:', error)
    return NextResponse.json({ faqs: [], reviewCount: 0, averageRating: 0, reviews: [] }, { status: 500 })
  }
}

