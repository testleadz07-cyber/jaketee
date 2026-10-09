'use client'

import type { FaqCategory } from '@/lib/faq-page-data'
import { FaqText } from '@/components/faq-text'
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

const SECTION_ICONS: Record<string, React.ElementType> = {
  Orders: Package, Shipping: Truck, 'Returns & Exchanges': RotateCcw,
  Payments: CreditCard, Account: UserCircle, 'Privacy & Security': ShieldCheck,
  'Design & Customization': Palette, 'Jacket Sizing': Ruler,
  'Production & Delivery': Factory, 'Bulk & Team Orders': Users,
}

export default function FaqPage({ categories }: { categories: FaqCategory[] }) {
  const mergedCategories = categories.map(category => ({ ...category, icon: SECTION_ICONS[category.title] || ShoppingBag }))

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'FAQ' }]} className="mb-6 max-w-4xl mx-auto" />
        <div className="max-w-4xl mx-auto">
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
                              <p key={pIdx}><FaqText text={p} /></p>
                            ))}
                            {item.bullets && item.bullets.length > 0 && (
                              <ul className="list-disc pl-5 space-y-1">
                                {item.bullets.map((b, bIdx) => (
                                  <li key={bIdx}><FaqText text={b} /></li>
                                ))}
                              </ul>
                            )}
                            {item.ordered && item.ordered.length > 0 && (
                              <ol className="list-decimal pl-5 space-y-1">
                                {item.ordered.map((o, oIdx) => (
                                  <li key={oIdx}><FaqText text={o} /></li>
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
