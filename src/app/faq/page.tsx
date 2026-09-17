import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'
import FaqPage, { type DbFaqItem } from './faq-client'

export const dynamic = 'force-dynamic'

export default async function Page() {
  if (!(await connectDB())) throw new Error('FAQs are temporarily unavailable')
  const rawFaqs = await Faq.find().sort({ category: 1, order: 1 }).lean()
  const dbFaqs: DbFaqItem[] = rawFaqs.map((faq) => ({
    id: String(faq._id),
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    bullets: faq.bullets ?? [],
    ordered: faq.ordered ?? [],
  }))
  return <FaqPage dbFaqs={dbFaqs} />
}
