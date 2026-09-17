import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'
import BlogPost from '@/models/BlogPost'

type Topic = 'shipping' | 'returns'

const resourceConfig = {
  shipping: {
    title: 'Shipping questions',
    faqQuestions: [
      'Are there any delivery charges?',
      'How long my custom jacket order will take to deliver?',
      'Can I track my order after it has been shipped?',
      'Do you offer rush order services?',
      'How fast can I get my bulk order?',
    ],
    extraFaqs: [],
    articleSlugs: [
      'custom-jackets-corporate-team-multiple-locations',
      'group-jacket-orders-manage-approvals-sizes-payments',
      'wholesale-custom-jackets-schools-teams',
    ],
  },
  returns: {
    title: 'Returns questions',
    faqQuestions: [
      'Do you offer returns and Exchange?',
      'I received a faulty item, what do I do?',
    ],
    extraFaqs: [
      {
        id: 'returns-window',
        question: 'How long do I have to request a stock jacket return?',
        answer: ['Request a return within 10 days of delivery. The jacket must be unworn, unwashed and in its original condition.'],
      },
      {
        id: 'returns-fee',
        question: 'What restocking fee applies to a change-of-mind return?',
        answer: ['The fee is 15% of the jacket price, with a minimum of $35, for an approved stock jacket return.'],
      },
      {
        id: 'returns-custom',
        question: 'Can I return a customized jacket?',
        answer: ['Customized jackets cannot be returned or exchanged for a change of mind. If your jacket is faulty or incorrect, contact us with your order number and photos so we can review it.'],
      },
    ],
    articleSlugs: [
      'what-to-do-if-jacket-patch-peeling-loosening',
      'why-jacket-fit-matters-how-to-get-it-right',
      'how-to-clean-a-varsity-jacket',
    ],
  },
} as const

export async function PolicyResources({ topic }: { topic: Topic }) {
  const config = resourceConfig[topic]
  const faqOrder: readonly string[] = config.faqQuestions
  const articleOrder: readonly string[] = config.articleSlugs
  let faqs: Array<{ id: string; question: string; answer: string[] }> = []
  let articles: Array<{ slug: string; title: string; excerpt: string }> = []

  try {
    const db = await connectDB()
    if (db) {
      const [faqRows, posts] = await Promise.all([
        Faq.find({ question: { $in: [...config.faqQuestions] } }).select('question answer').lean(),
        BlogPost.find({
          slug: { $in: [...config.articleSlugs] },
          $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: new Date() } }],
        }).select('slug title excerpt').lean(),
      ])
      faqs = faqRows
        .map((faq) => ({ id: String(faq._id), question: faq.question, answer: faq.answer || [] }))
        .sort((a, b) => faqOrder.indexOf(a.question) - faqOrder.indexOf(b.question))
      articles = posts
        .map((post) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt }))
        .sort((a, b) => articleOrder.indexOf(a.slug) - articleOrder.indexOf(b.slug))
    }
  } catch (error) {
    console.error(`Error loading ${topic} resources:`, error)
  }

  faqs = [...faqs, ...config.extraFaqs.map((faq) => ({ ...faq, answer: [...faq.answer] }))]
  if (!faqs.length && !articles.length) return null

  return (
    <div>
      {faqs.length > 0 && (
        <section className="border-t bg-muted/20 py-10 md:py-14" aria-labelledby={`${topic}-faq-heading`}>
          <div className="container mx-auto max-w-5xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <h2 id={`${topic}-faq-heading`} className="text-2xl font-semibold">{config.title}</h2>
              <Link href="/faq" className="text-sm font-semibold underline underline-offset-4">View all FAQs</Link>
            </div>
            <Accordion type="single" collapsible>
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {faq.answer.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <section className="border-t bg-background py-10 md:py-14" aria-labelledby={`${topic}-article-heading`}>
          <div className="container mx-auto max-w-5xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <h2 id={`${topic}-article-heading`} className="text-2xl font-semibold">Related articles</h2>
              <Link href="/blog" className="text-sm font-semibold underline underline-offset-4">View all articles</Link>
            </div>
            <div className="grid gap-x-8 md:grid-cols-3">
              {articles.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`} className="group flex min-w-0 flex-col border-b py-6">
                  <h3 className="text-lg font-semibold leading-snug group-hover:underline">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold">Read article <ArrowRight className="h-4 w-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
