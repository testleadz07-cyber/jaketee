export const dynamic = 'force-dynamic'

import { connection } from 'next/server'
import { getPublicFaqPage } from '@/lib/public-faq-page'
import FaqPage from './faq-client'
import { buildFaqCategories, type FaqCategory } from '@/lib/faq-page-data'
import { productFaqAnswerText } from '@/lib/product-faqs'

export const revalidate = 3600

export default async function Page() {
  let categories: FaqCategory[]
  try {
    categories = await getPublicFaqPage()
  } catch (error) {
    await connection()
    console.error('Unable to load FAQs; using the published fallback answers', error)
    categories = buildFaqCategories([])
  }
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
