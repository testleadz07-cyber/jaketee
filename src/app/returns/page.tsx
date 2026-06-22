'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import {
  RotateCcw,
  Calendar,
  Check,
  AlertCircle,
  ShoppingBag,
  ChevronLeft,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'Returns' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Returns & Exchanges</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our hassle-free return policy ensures you can shop with confidence.
            </p>
          </div>

          {/* Return Policy Overview */}
          <Card className="border-2 mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                30-Day Return Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">
                We offer a 30-day return policy from the date of delivery.
              </p>
              <p className="text-muted-foreground">
                If you're not completely satisfied with your purchase, you can return it
                for a full refund or exchange within 30 days of receiving your order.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Full Refund</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Free Exchanges</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Easy Process</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Conditions */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-primary" />
                Return Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Items must be in original condition
                  </h3>
                  <p className="text-sm text-muted-foreground ml-7">
                    Unworn, unwashed, and with all original tags attached
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Original packaging required
                  </h3>
                  <p className="text-sm text-muted-foreground ml-7">
                    Return items in their original packaging or a suitable alternative
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Proof of purchase needed
                  </h3>
                  <p className="text-sm text-muted-foreground ml-7">
                    Include your order number or receipt with the return
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Return within 30 days
                  </h3>
                  <p className="text-sm text-muted-foreground ml-7">
                    From the date of delivery confirmation
                  </p>
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Non-returnable Items
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                  <li>• Personalized or custom items</li>
                  <li>• Undergarments and swimwear (with hygiene seal removed)</li>
                  <li>• Items marked as final sale</li>
                  <li>• Gift cards</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Return Process */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">How to Return an Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Initiate Return</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact us at <span className="font-medium">returns@luxestore.com</span> or use the contact form with your order number
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Receive Return Label</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll email you a prepaid return shipping label (free for domestic returns)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Pack & Ship</h3>
                    <p className="text-sm text-muted-foreground">
                      Pack the item securely with all tags and attach the shipping label
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Receive Refund</h3>
                    <p className="text-sm text-muted-foreground">
                      Once we receive and inspect the item, we'll process your refund within 5-7 business days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exchanges */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Exchanges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We offer free exchanges for a different size or color of the same item.
                Simply follow the return process and indicate your preferred exchange option.
              </p>
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Free exchange shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Quick processing within 2-3 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>No restocking fees</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                *If your preferred size/color is out of stock, we'll offer a refund or store credit
              </p>
            </CardContent>
          </Card>

          {/* Refund Information */}
          <Card className="border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Refund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Processing Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Refunds are processed within 5-7 business days after we receive your return
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold mb-2">Refund Method</h4>
                  <p className="text-sm text-muted-foreground">
                    Refunds are credited to the original payment method used for purchase
                  </p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Please allow additional time for your bank or credit card company to post the refund
                to your account (typically 3-5 business days).
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                Ready to make a return?
              </h3>
              <p className="text-muted-foreground mb-4">
                Contact our customer service team and we'll help you through the process.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/contact">
                  <Button>Start Return Process</Button>
                </Link>
                <Link href="/shipping">
                  <Button variant="outline">Shipping Info</Button>
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