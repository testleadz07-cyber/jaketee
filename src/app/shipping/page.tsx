'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import {
  Truck,
  Package,
  Clock,
  Globe,
  ShoppingBag,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'Shipping' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Information</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our shipping policies and delivery options.
            </p>
          </div>

          {/* Shipping Methods */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                Shipping Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Standard Shipping</h3>
                    <p className="text-sm text-muted-foreground">5-7 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">FREE</p>
                    <p className="text-xs text-muted-foreground">Orders over $50</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Orders under $50: $5.99
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Express Shipping</h3>
                    <p className="text-sm text-muted-foreground">2-3 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">$12.99</p>
                    <p className="text-xs text-muted-foreground">Free on orders $100+</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Next Day Delivery</h3>
                    <p className="text-sm text-muted-foreground">1 business day</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">$24.99</p>
                    <p className="text-xs text-muted-foreground">Free on orders $150+</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Order by 2 PM EST for next day delivery
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Shipping */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                International Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We ship to over 100 countries worldwide. International shipping rates
                are calculated at checkout based on your location and package weight.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Delivery within 7-14 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Tracking provided for all orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Customs duties included in price</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                *Some remote locations may have longer delivery times
              </p>
            </CardContent>
          </Card>

          {/* Processing Time */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Order Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Orders are processed within 1-2 business days. You'll receive a
                confirmation email with tracking information once your order ships.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Processing Times</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Standard items: 1-2 business days</li>
                    <li>• Personalized items: 3-5 business days</li>
                    <li>• Pre-order items: As specified</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Cut-off Times</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Express/Next Day: 2 PM EST</li>
                    <li>• Standard: 5 PM EST</li>
                    <li>• Weekends: Orders processed Monday</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Tracking */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Package Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All orders include free tracking. You'll receive your tracking number via
                email once your order ships. Track your package anytime on our website or
                the carrier's website.
              </p>
              <Separator />
              <div className="space-y-2">
                <p className="font-semibold">Carriers we use:</p>
                <p className="text-muted-foreground">
                  UPS, FedEx, DHL, USPS, and local postal services depending on your
                  location and shipping method selected.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Restrictions */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Shipping Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <span className="text-muted-foreground">
                    We cannot ship to P.O. boxes for express or next-day delivery
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <span className="text-muted-foreground">
                    International orders may be subject to customs delays
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <span className="text-muted-foreground">
                    Some items may have shipping restrictions due to size or weight
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                Have questions about shipping?
              </h3>
              <p className="text-muted-foreground mb-4">
                Our customer service team is here to help with any shipping inquiries.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/contact">
                  <Button>Contact Us</Button>
                </Link>
                <Link href="/returns">
                  <Button variant="outline">Returns Policy</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Luxe Store. All rights reserved.
        </div>
      </footer>
    </div>
  )
}