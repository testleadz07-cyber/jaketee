'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Footer } from '@/components/footer'

export default function ReturnsClient({ resources }: { resources: React.ReactNode }) {
  const [form, setForm] = useState({ orderId: '', name: '', email: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.orderId.trim() || !form.reason.trim()) {
      setError('Order number and reason are required.')
      return
    }
    if (form.reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters).')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: form.orderId, reason: form.reason, userName: form.name, userEmail: form.email })
      })
      if (res.ok) {
        setSubmitted(true)
        setForm({ orderId: '', name: '', email: '', reason: '' })
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

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
              Review eligibility and charges before requesting a return.
            </p>
          </div>

          {/* Return Policy Overview */}
          <Card className="border-2 mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                10-Day Stock Jacket Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">
                Eligible, non-customized stock jackets can be returned within 10 days of delivery.
              </p>
              <p className="text-muted-foreground">
                A restocking fee of 15% of the jacket price, with a minimum of $35, is deducted from approved change-of-mind returns.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">10-day request window</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Stock jackets only</span>
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
                    Request a return within 10 days
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
              <p className="text-sm text-muted-foreground">If your jacket arrives faulty or incorrect, contact us with your order number and photos. We will review the issue and arrange an appropriate remedy. The change-of-mind restocking fee does not apply to these cases.</p>
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
                      Contact us at <span className="font-medium">info@jacketee.com</span> or use the contact form with your order number
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Receive Instructions</h3>
                    <p className="text-sm text-muted-foreground">
                      We will confirm eligibility, the return address and any applicable charges before you ship the item.
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
                      Pack the item securely with all tags and follow the return instructions we provide.
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
                      Once we receive and inspect the item, we'll confirm the approved refund amount and process it to your original payment method.
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
                For eligible stock jackets, request a size or color exchange within 10 days of delivery. Contact us before shipping the item; availability and any applicable charges will be confirmed first.
              </p>
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Subject to stock availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Custom jackets are not exchangeable for a change of mind</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Faulty or incorrect items are reviewed separately</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                If your preferred size or color is unavailable, contact us to discuss the available options.
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
                    Refunds are processed after we receive and inspect your return.
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
                Your bank or card provider may need additional time to post the refund to your account.
              </p>
            </CardContent>
          </Card>

          {/* Submit Request Form */}
          <Card className="border-2" id="request-form">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" />
                Submit a Return or Refund Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center gap-4"
                >
                  <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  <div>
                    <p className="font-bold text-lg">Request Submitted!</p>
                    <p className="text-muted-foreground text-sm mt-1">We have received your return/refund request and will review it within 1-2 business days.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>Submit Another Request</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order Number *</Label>
                      <Input
                        id="orderId"
                        placeholder="e.g. LX-2024-001"
                        value={form.orderId}
                        onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnName">Your Name</Label>
                      <Input
                        id="returnName"
                        placeholder="Full name (optional)"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnEmail">Email Address</Label>
                    <Input
                      id="returnEmail"
                      type="email"
                      placeholder="your@email.com (optional)"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnReason">Reason for Return *</Label>
                    <Textarea
                      id="returnReason"
                      rows={4}
                      placeholder="Please describe why you would like to return or exchange this item..."
                      value={form.reason}
                      onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                      required
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">{form.reason.length} / 10 minimum characters</p>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <Button type="submit" disabled={submitting} className="gap-2 w-full sm:w-auto">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Request
                  </Button>
                </form>
              )}
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

      {resources}
      <Footer />
    </div>
  )
}
