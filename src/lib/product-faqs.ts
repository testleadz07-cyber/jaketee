export interface ProductFaq {
  id: string
  question: string
  answer: string[]
  bullets: string[]
  ordered: string[]
}

export function buildProductFaqs(faqs: ProductFaq[], categoryName: string, includeSize: boolean) {
  const fallbackFaqs: ProductFaq[] = [
    ...(includeSize ? [{ id: 'fit', question: `How do I choose the right size for ${categoryName}?`, answer: ['Use the size guide beside the price to measure your chest, shoulders, sleeves, and jacket length. For measurements of this exact style, contact our team before ordering.'], bullets: [], ordered: [] }] : []),
    { id: 'options', question: `What options are available for this ${categoryName.toLowerCase()} style?`, answer: ['Available selections, when offered, are shown in the product details and purchase controls above. Contact our team if you need an option that is not listed.'], bullets: [], ordered: [] },
    { id: 'delivery', question: 'Where can I check shipping and return eligibility?', answer: ['See the shipping and returns links beside the purchase controls for current delivery details and exclusions for personalized items.'], bullets: [], ordered: [] },
  ]
  return [...faqs, ...fallbackFaqs.filter((fallback) => !faqs.some((faq) => faq.question.toLowerCase() === fallback.question.toLowerCase()))].slice(0, 4)
}

export function productFaqAnswerText(faq: ProductFaq) {
  return [...faq.answer, ...faq.bullets, ...faq.ordered].filter(Boolean).join(' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
}
