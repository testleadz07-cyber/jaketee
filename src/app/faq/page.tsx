import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'
import FaqPage from './faq-client'
import { buildFaqCategories, type DbFaqItem } from '@/lib/faq-page-data'
import { productFaqAnswerText } from '@/lib/product-faqs'

export const dynamic = 'force-dynamic'

export default async function Page() {
  if (!(await connectDB())) throw new Error('FAQs are temporarily unavailable')
  const rawFaqs = await Faq.find().sort({ category: 1, order: 1 }).lean()
  const dbFaqs: DbFaqItem[] = rawFaqs.map((faq) => ({
    id: String(faq._id),
    status: faq.status,
    mergedQuestions: faq.mergedQuestions || [],
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    bullets: faq.bullets ?? [],
    ordered: faq.ordered ?? [],
  }))
  const categories = buildFaqCategories(dbFaqs)
  const schema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: categories.flatMap(category => category.items.map(faq => ({
      '@type': 'Question', name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: productFaqAnswerText({ id: '', ...faq, answer: Array.isArray(faq.answer) ? faq.answer : [faq.answer], bullets: faq.bullets || [], ordered: faq.ordered || [] }) },
    }))),
  }
  return <>
    {schema.mainEntity.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}
    <FaqPage categories={categories} />
  </>
}
