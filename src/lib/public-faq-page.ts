import 'server-only'
import { createHash } from 'crypto'
import { publicRead } from '@/lib/public-cache'
import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'
import { buildFaqCategories, type DbFaqItem } from '@/lib/faq-page-data'
import { faqMatchesScope } from '@/lib/faq-scope'

const fallbackVersion = createHash('sha256').update(`scoped-v1:${JSON.stringify(buildFaqCategories([]))}`).digest('hex')

export function getPublicFaqPage() {
  return publicRead('faq-page', fallbackVersion, 3600, ['public-faq-page'], async () => {
    if (!await connectDB()) throw new Error('FAQs unavailable')
    // Draft/merged question names suppress fallback duplicates. Keep that logic
    // on the server and cache only the final public categories, not raw drafts.
    const rows = await Faq.find().select('status mergedQuestions question answer category bullets ordered order displayPages')
      .sort({ category: 1, order: 1, _id: 1 }).lean()
    const items: DbFaqItem[] = rows.filter(faq => faqMatchesScope(faq, { targets: ['/faq'], allowUnscoped: true })).map(faq => ({
      id: String(faq._id), status: faq.status, mergedQuestions: faq.mergedQuestions || [],
      question: faq.question, answer: faq.answer, category: faq.category,
      bullets: faq.bullets || [], ordered: faq.ordered || [],
    }))
    return buildFaqCategories(items)
  })
}
