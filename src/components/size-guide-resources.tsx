import { BlogCard } from '@/components/blog-card'
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
  let posts: Array<{ slug: string; title: string; excerpt: string }> = []

  try {
    const db = await connectDB()
    if (db) {
      const now = new Date()
      const [faqRows, postRows] = await Promise.all([
        Faq.find({ status: { $ne: 'draft' }, category: { $in: ['jacket-sizing', 'Jacket Sizing'] } }).sort({ order: 1 }).limit(6).lean(),
        BlogPost.find({
          slug: { $in: articleSlugs },
          $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
        }).select('slug title excerpt').lean(),
      ])

      faqs = faqRows.map((faq) => ({
        id: String(faq._id),
        question: faq.question,
        answer: faq.answer || [],
        bullets: faq.bullets || [],
        ordered: faq.ordered || [],
      }))
      posts = postRows
        .map((post) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt }))
        .sort((a, b) => articleSlugs.indexOf(a.slug) - articleSlugs.indexOf(b.slug))
    }
  } catch (error) {
    console.error('Error loading size guide resources:', error)
  }

  if (faqs.length === 0 && posts.length === 0) return null

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
                    {faq.answer.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
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
