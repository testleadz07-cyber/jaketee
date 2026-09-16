import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
        Faq.find({ category: 'jacket-sizing' }).sort({ order: 1 }).limit(6).lean(),
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
            <div className="grid gap-x-10 md:grid-cols-2">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex min-w-0 flex-col border-b py-6">
                  <h3 className="text-lg font-semibold leading-snug group-hover:underline">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Read article <ArrowRight className="h-4 w-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
