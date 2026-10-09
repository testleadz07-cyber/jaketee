import { internationalShippingAnswer, fulfillmentConfig } from '@/config/fulfillment'

export interface FaqItem {
  question: string
  answer: string | string[]
  bullets?: string[]
  ordered?: string[]
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

export interface DbFaqItem {
  id: string
  question: string
  answer: string[]
  category: string
  bullets: string[]
  ordered: string[]
  status?: string
  mergedQuestions?: string[]
}

const faqCategories: FaqCategory[] = [
  {
    title: 'Orders',
    items: [
      {
        question: 'How do I place an order?',
        answer:
          'Simply browse our catalog, add items to your cart, and proceed to checkout. Follow the prompts to enter your shipping and payment details, then confirm your order.',
      },
      {
        question: 'Can I change or cancel my order after placing it?',
        answer:
          'We process orders quickly, so changes or cancellations can only be made within a short window after purchase. Contact us as soon as possible and we will do our best to help.',
      },
      {
        question: 'How can I track my order?',
        answer:
          "Once your order ships, you'll receive a confirmation email with a tracking number. You can also view order status and tracking from your account's order history.",
      },
      {
        question: 'What should I do if my order arrives damaged or incorrect?',
        answer:
          'Please contact our support team within 48 hours of delivery with photos of the item and packaging. We will arrange a replacement, refund, or exchange as quickly as possible.',
      },
    ],
  },
  {
    title: 'Shipping',
    items: [
      {
        question: 'How long does shipping take?',
        answer:
          `${fulfillmentConfig.individualProduction} ${fulfillmentConfig.individualDelivery} ${fulfillmentConfig.bulkProductionDelivery}`,
      },
      {
        question: 'Do you ship internationally?',
        answer:
          internationalShippingAnswer,
      },
      {
        question: 'How much is shipping?',
        answer:
          'One jacket ships for $45 USD. Shipping for two or more jackets is quoted based on quantity and weight.',
      },
    ],
  },
  {
    title: 'Returns & Exchanges',
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'Eligible, non-customized stock jackets may be returned within 10 days of delivery. A 15% restocking fee, minimum $35, applies to change-of-mind returns. Customized jackets are not returnable for a change of mind; faulty or incorrect items are reviewed separately.',
      },
      {
        question: 'How do I start a return or exchange?',
        answer:
          'Go to the Returns & Exchanges page and submit a request with your order number. We will confirm eligibility, charges and return instructions before you ship the item.',
      },
      {
        question: 'When will I get my refund?',
        answer:
          'After we receive and inspect an approved return, we process the refund to your original payment method. Your bank or card provider may need additional time to post it.',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit and debit cards, along with other secure payment options available at checkout.',
      },
      {
        question: 'Is it safe to enter my card details on your site?',
        answer:
          'Yes. All payments are processed through encrypted, PCI-compliant payment providers. We never store your full card details on our servers.',
      },
      {
        question: 'Can I get an invoice for my order?',
        answer:
          'Yes, an invoice is included in your order confirmation email, and you can also download it from your account order history.',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        question: 'Do I need an account to place an order?',
        answer:
          "No, you can check out as a guest. Creating an account lets you track orders, save addresses, and check out faster next time.",
      },
      {
        question: 'How do I reset my password?',
        answer:
          "Click \"Forgot password\" on the login page and enter your email address. We'll send you a link to reset your password.",
      },
      {
        question: 'How do I update my account information?',
        answer:
          'Log in and go to your Profile page to update your name, email, addresses, and preferences at any time.',
      },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      {
        question: 'How is my personal information used?',
        answer:
          'We only use your information to process orders, improve our services, and — with your consent — send marketing communications. See our Privacy Policy for full details.',
      },
      {
        question: 'How do I manage cookie preferences?',
        answer:
          'You can update your cookie preferences at any time from the link in our footer, or review our Cookie Policy for more information.',
      },
    ],
  },
]

export const FAQ_SECTION_ORDER = ['Orders', 'Shipping', 'Returns & Exchanges', 'Payments', 'Account', 'Privacy & Security', 'Design & Customization', 'Jacket Sizing', 'Production & Delivery', 'Bulk & Team Orders', 'Varsity Jackets', 'Leather Jackets', 'Puffer Jackets', 'Bomber Jackets', 'Denim Jackets', 'Coach Jackets', 'Fleece Hoodies', 'Patches & Embroidery', 'General']
const CATEGORY_TITLES: Record<string, string> = {
  'how-to-design': 'Design & Customization', 'single-jacket-orders': 'Orders',
  'bulk-team-orders': 'Bulk & Team Orders', 'jacket-sizing': 'Jacket Sizing',
  'production-delivery': 'Production & Delivery', payment: 'Payments',
  'returns-exchanges': 'Returns & Exchanges', common: 'General',
}
export function hasFaqAnswer(faq: { answer: string | string[]; bullets?: string[]; ordered?: string[] }) {
  return [...(Array.isArray(faq.answer) ? faq.answer : [faq.answer]), ...(faq.bullets || []), ...(faq.ordered || [])].some(text => text?.trim())
}
export function buildFaqCategories(dbFaqs: DbFaqItem[]): FaqCategory[] {
  const normalize = (text: string) => text.trim().toLowerCase()
  // Database entries override fallback questions, including drafts and empty answers.
  const dbQuestions = new Set(dbFaqs.flatMap(faq => [faq.question, ...(faq.mergedQuestions || [])].map(normalize)))
  const categories = faqCategories.map(category => ({ ...category, items: category.items.filter(item => !dbQuestions.has(normalize(item.question))) }))
  const byTitle = new Map(categories.map(category => [category.title, category]))
  const seen = new Set<string>()
  for (const faq of dbFaqs) {
    if (faq.status === 'draft' || !faq.question.trim() || !hasFaqAnswer(faq)) continue
    const key = normalize(faq.question)
    if (seen.has(key)) continue
    seen.add(key)
    const title = CATEGORY_TITLES[faq.category] || (FAQ_SECTION_ORDER.includes(faq.category) ? faq.category : 'General')
    let category = byTitle.get(title)
    if (!category) {
      category = { title, items: [] }
      categories.push(category)
      byTitle.set(title, category)
    }
    category.items.push({ question: faq.question, answer: faq.answer, bullets: faq.bullets, ordered: faq.ordered })
  }
  return categories.filter(category => category.items.length > 0).sort((a, b) => FAQ_SECTION_ORDER.indexOf(a.title) - FAQ_SECTION_ORDER.indexOf(b.title))
}
