import { publicRead } from '@/lib/public-cache'
import { BlogCard } from '@/components/blog-card'
import Link from 'next/link'
import Faq from '@/models/Faq'
import BlogPost from '@/models/BlogPost'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type BulkOrderKind = 'schools' | 'corporate' | 'private-label'

const CONTENT: Record<BulkOrderKind, { label: string; blogSlugs: string[] }> = {
  schools: {
    label: 'school and team orders',
    blogSlugs: [
      'varsity-jackets-for-academic-achievement-not-just-sports',
      'do-colleges-and-universities-still-use-varsity-jackets',
    ],
  },
  corporate: {
    label: 'corporate jacket orders',
    blogSlugs: [
      'are-varsity-jackets-professional-enough-for-business-events',
      'how-to-style-a-varsity-jacket-for-work-or-business-casual',
    ],
  },
  'private-label': {
    label: 'private label jackets',
    blogSlugs: [
      'private-label-varsity-jackets-how-brands-can-build-their-own-jacket-line',
      'private-label-vs-custom-jacket-orders-what-is-the-difference',
      'varsity-jacket-brand-launch-checklist-labels-samples-packaging-and-reorders',
    ],
  },
}

export async function BulkOrderResources({ kind }: { kind: BulkOrderKind }) {
  const config = CONTENT[kind]
  const pagePath = `/bulk-orders/${kind}`
  let faqs: Array<{ id: string; question: string; answer: string[]; bullets: string[]; ordered: string[] }> = []
  let posts: Array<{ slug: string; title: string; excerpt: string }> = []

  try {
    {
      const now = new Date()
      const [faqRows, postRows] = await publicRead('bulk-order-resources', kind, 300, ['public-support', 'public-blog'], async () => Promise.all([
        Faq.find({ status: { $ne: 'draft' }, displayPages: pagePath }).sort({ order: 1 }).limit(8).lean(),
        BlogPost.find({
          slug: { $in: config.blogSlugs },
          $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
        }).select('slug title excerpt').lean(),
      ]))
      faqs = faqRows.map((faq: any) => ({
        id: String(faq._id),
        question: faq.question,
        answer: faq.answer || [],
        bullets: faq.bullets || [],
        ordered: faq.ordered || [],
      }))
      posts = postRows
        .map((post: any) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt }))
        .sort((a, b) => config.blogSlugs.indexOf(a.slug) - config.blogSlugs.indexOf(b.slug))
    }
  } catch (error) {
    console.error(`Error loading ${kind} resources:`, error)
  }

  if (faqs.length === 0 && posts.length === 0) return null

  return (
    <>
      {faqs.length > 0 && (
        <section className="border-t bg-background py-12 md:py-16" aria-labelledby={`${kind}-faq-heading`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Questions answered</p>
                <h2 id={`${kind}-faq-heading`} className="mt-2 text-2xl font-semibold md:text-3xl">FAQs about {config.label}</h2>
              </div>
              <Link href="/faq" className="text-sm font-semibold underline underline-offset-4">All FAQs</Link>
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
        <section className="border-y bg-muted/30 py-12 md:py-16" aria-labelledby={`${kind}-articles-heading`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Further reading</p>
                <h2 id={`${kind}-articles-heading`} className="mt-2 text-2xl font-semibold md:text-3xl">Guides for {config.label}</h2>
              </div>
              <Link href="/blog" className="text-sm font-semibold underline underline-offset-4">All articles</Link>
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
