// Server component — injects FAQPage JSON-LD schema for rich results in Google Search
// and applies this route's metadata (title/canonical/OG/Twitter), since the
// 'use client' page.tsx can't export metadata itself.

export { metadata } from './metadata'

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    // Orders
    {
      '@type': 'Question',
      name: 'How do I place an order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply browse our catalog, add items to your cart, and proceed to checkout. Follow the prompts to enter your shipping and payment details, then confirm your order.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I change or cancel my order after placing it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We process orders quickly, so changes or cancellations can only be made within a short window after purchase. Contact us as soon as possible and we will do our best to help.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I track my order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also view order status and tracking from your account's order history.",
      },
    },
    // Shipping
    {
      '@type': 'Question',
      name: 'How long does shipping take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard shipping takes 5–7 business days. Expedited shipping (2–3 business days) and overnight options are available at checkout.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer free shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Orders over $75 qualify for free standard shipping within the continental US.',
      },
    },
    // Returns
    {
      '@type': 'Question',
      name: 'What is your return policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept returns within 30 days of delivery for items in original, unworn condition with tags attached. Start a return from your account or contact our support team.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does a refund take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Once we receive and inspect your return, refunds are processed within 3–5 business days to your original payment method.',
      },
    },
    // Payments
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) and PayPal.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my payment information secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. All transactions are encrypted with industry-standard TLS/SSL. We never store your card details on our servers.',
      },
    },
  ],
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
