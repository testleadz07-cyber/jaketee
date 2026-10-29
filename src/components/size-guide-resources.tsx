import { publicRead } from '@/lib/public-cache'
import { connection } from 'next/server'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import { FaqText } from '@/components/faq-text'
import { BlogCard, type BlogCardArticle } from '@/components/blog-card'
import Link from 'next/link'
import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'
import BlogPost from '@/models/BlogPost'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const articleSlugs = [
  'how-to-choose-custom-varsity-jacket-size',
  'why-jacket-fit-matters-how-to-get-it-right',
  'oversized-vs-fitted-jacket-silhouette-team',
  'how-to-collect-sizes-from-your-team-bulk-jacket-order',
]

export async function SizeGuideResources() {
  let faqs: Array<{ id: string; question: string; answer: string[]; bullets: string[]; ordered: string[] }> = []
  let posts: BlogCardArticle[] = []

  try {
    const data = await publicRead('size-guide-resources', articleSlugs, 300, ['public-support', 'public-blog', 'public-products'], async () => {
      if (!await connectDB()) throw new Error('Size guide resources unavailable')
      const now = new Date()
      const [faqRows, postRows, imageCandidates] = await Promise.all([
        Faq.find({ status: { $ne: 'draft' }, mergedInto: null, category: { $in: ['jacket-sizing', 'Jacket Sizing'] } }).sort({ order: 1 }).limit(6).lean(),
        BlogPost.find({
          slug: { $in: articleSlugs },
          status: 'published', $or: [{ publishedAt: { $lte: now } }, { publishedAt: null }],
        }).select('slug title excerpt featuredImage taggedProducts publishedAt').lean(),
        getBlogImageCandidates(),
      ])

      const faqs = faqRows.filter(faq => faq.question?.trim() && [...(faq.answer || []), ...(faq.bullets || []), ...(faq.ordered || [])].some(text => text.trim())).map((faq) => ({
        id: String(faq._id),
        question: faq.question,
        answer: faq.answer || [],
        bullets: faq.bullets || [],
        ordered: faq.ordered || [],
      }))
      const posts = postRows
        .map((post) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt, featuredImage: resolveBlogImage(post, imageCandidates), publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null }))
        .sort((a, b) => articleSlugs.indexOf(a.slug) - articleSlugs.indexOf(b.slug)).slice(0, 3)
      return { faqs, posts }
    })
    faqs = data.faqs
    posts = data.posts
  } catch (error) {
    await connection()
    console.error('Error loading size guide resources:', error)
  }

  const fallback = [
    ['Should I measure my body or a jacket I already own?', 'Use body circumferences with the body chart. Use a closed garment laid flat with the finished-garment chart. Do not compare body chest circumference directly with flat jacket width.'],
    ['Is the estimated size a guaranteed fit?', 'No. The estimate uses the reference body chart on this page. Confirm the dimensions and fit of the exact product before ordering.'],
    ['What should I do if I fall between sizes?', 'Compare your chest and waist with the product measurements and consider the layers you intend to wear. Ask our team if the measurements point to different sizes.'],
    ['Where should I measure sleeve length?', 'For the finished jacket reference, measure from the shoulder seam to the end of the cuff, including ribbing. Confirm the measuring method for the exact product.'],
    ['Are these charts for every jacket and vest?', 'These are planning references, not specifications for every product. Finished vest dimensions, tall options and individual style measurements should be confirmed on the product page or with our team.'],
    ['Can you help with sizes for a group order?', 'Collect chest and waist measurements for each person using the same method and units. Contact our team with your selected products and measurements before confirming the order.'],
  ]
  for (const [question, answer] of fallback) {
    if (faqs.length >= 6) break
    if (!faqs.some(item => item.question.toLowerCase() === question.toLowerCase())) faqs.push({ id: `sizing-guide-${faqs.length}`, question, answer: [answer], bullets: [], ordered: [] })
  }

  return (
    <>
      {faqs.length > 0 && (
        <section className="border-b bg-background py-10 md:py-14" aria-labelledby="size-guide-faq-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Sizing questions</p>
                <h2 id="size-guide-faq-heading" className="mt-2 text-2xl font-semibold">Jacket sizing FAQs</h2>
              </div>
              <Link href="/faq" className="text-sm font-semibold underline underline-offset-4">View all FAQs</Link>
            </div>
            <Accordion type="single" collapsible className="max-w-4xl">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {faq.answer.map((paragraph, index) => <p key={index}><FaqText text={paragraph} /></p>)}
                    {faq.bullets.length > 0 && <ul className="list-disc pl-5">{faq.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
                    {faq.ordered.length > 0 && <ol className="list-decimal pl-5">{faq.ordered.map((step, index) => <li key={index}>{step}</li>)}</ol>}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="border-b bg-muted/25 py-10 md:py-14" aria-labelledby="size-guide-articles-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Further reading</p>
                <h2 id="size-guide-articles-heading" className="mt-2 text-2xl font-semibold">More on jacket fit</h2>
              </div>
              <Link href="/blog" className="text-sm font-semibold underline underline-offset-4">View all articles</Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => <BlogCard key={post.slug} article={post} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
