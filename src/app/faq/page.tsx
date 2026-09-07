'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import {
  HelpCircle,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  UserCircle,
  ShieldCheck,
  Palette,
  ShoppingBag,
  Users,
  Ruler,
  Factory,
} from 'lucide-react'
import Link from 'next/link'

interface FaqItem {
  question: string
  answer: string | string[]
  bullets?: string[]
  ordered?: string[]
}

interface FaqCategory {
  title: string
  icon: React.ElementType
  items: FaqItem[]
}

interface DbFaqItem {
  id: string
  question: string
  answer: string[]
  category: string
  bullets: string[]
  ordered: string[]
}

const CATEGORY_META: Record<string, { title: string; icon: React.ElementType }> = {
  'how-to-design': { title: 'Design & Customization', icon: Palette },
  'single-jacket-orders': { title: 'Single Jacket Orders', icon: ShoppingBag },
  'bulk-team-orders': { title: 'Bulk & Team Orders', icon: Users },
  'jacket-sizing': { title: 'Jacket Sizing', icon: Ruler },
  'production-delivery': { title: 'Production & Delivery', icon: Factory },
  payment: { title: 'Payments', icon: CreditCard },
  'returns-exchanges': { title: 'Returns & Exchanges', icon: RotateCcw },
  common: { title: 'General', icon: HelpCircle },
}

const faqCategories: FaqCategory[] = [
  {
    title: 'Orders',
    icon: Package,
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
    icon: Truck,
    items: [
      {
        question: 'How long does shipping take?',
        answer:
          'Standard shipping takes 5-7 business days, express shipping takes 2-3 business days, and next day delivery is available for orders placed before 2 PM EST. See our Shipping page for full details.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes, we ship to over 100 countries. International delivery typically takes 7-14 business days, and rates are calculated at checkout based on destination and package weight.',
      },
      {
        question: 'Is shipping free?',
        answer:
          'Standard shipping is free on orders over $50. Express and next day delivery have reduced or free shipping thresholds on larger orders — see the Shipping page for exact amounts.',
      },
    ],
  },
  {
    title: 'Returns & Exchanges',
    icon: RotateCcw,
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'We accept returns within 30 days of delivery for unworn, unwashed items with original tags attached. Visit our Returns page to start a request.',
      },
      {
        question: 'How do I start a return or exchange?',
        answer:
          'Go to the Returns & Exchanges page and submit a return request with your order number. We will email you a prepaid shipping label and instructions.',
      },
      {
        question: 'When will I get my refund?',
        answer:
          'Refunds are processed within 3-5 business days after we receive and inspect your return. It may take a few additional days for the funds to appear in your account.',
      },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
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
    icon: UserCircle,
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
    icon: ShieldCheck,
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

export default function FaqPage() {
  const [dbFaqs, setDbFaqs] = useState<DbFaqItem[]>([])

  useEffect(() => {
    fetch('/api/faqs')
      .then((res) => res.json())
      .then((data) => setDbFaqs(Array.isArray(data) ? data : []))
      .catch(() => setDbFaqs([]))
  }, [])

  const mergedCategories = useMemo(() => {
    const normalize = (s: string) => s.trim().toLowerCase()
    const categories: FaqCategory[] = faqCategories.map((c) => ({ ...c, items: [...c.items] }))
    const byTitle = new Map(categories.map((c) => [c.title, c]))

    const seen = new Set<string>()
    categories.forEach((c) => c.items.forEach((i) => seen.add(normalize(i.question))))

    dbFaqs.forEach((f) => {
      const key = normalize(f.question)
      if (seen.has(key)) return
      seen.add(key)

      const meta = CATEGORY_META[f.category] || { title: 'General', icon: HelpCircle }
      let target = byTitle.get(meta.title)
      if (!target) {
        target = { title: meta.title, icon: meta.icon, items: [] }
        categories.push(target)
        byTitle.set(meta.title, target)
      }
      target.items.push({
        question: f.question,
        answer: f.answer,
        bullets: f.bullets,
        ordered: f.ordered,
      })
    })

    return categories
  }, [dbFaqs])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'FAQ' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to common questions about orders, shipping, returns, and more.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {mergedCategories.map((category) => (
              <Card key={category.title} className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <category.icon className="h-6 w-6 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, idx) => {
                      const paragraphs = Array.isArray(item.answer) ? item.answer : [item.answer]
                      return (
                        <AccordionItem key={idx} value={`${category.title}-${idx}`}>
                          <AccordionTrigger className="text-base font-medium">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground space-y-2">
                            {paragraphs.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                            {item.bullets && item.bullets.length > 0 && (
                              <ul className="list-disc pl-5 space-y-1">
                                {item.bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            )}
                            {item.ordered && item.ordered.length > 0 && (
                              <ol className="list-decimal pl-5 space-y-1">
                                {item.ordered.map((o, oIdx) => (
                                  <li key={oIdx}>{o}</li>
                                ))}
                              </ol>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10 mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Our support team is happy to help.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/contact">
                  <Button>Contact Us</Button>
                </Link>
                <Link href="/shipping">
                  <Button variant="outline">Shipping Info</Button>
                </Link>
                <Link href="/returns">
                  <Button variant="outline">Returns Policy</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
