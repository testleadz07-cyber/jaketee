'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, CheckCircle, Package, ArrowRight, Calendar, MapPin, CreditCard, Download } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variants: Array<{ name: string; value: string }>
}

interface Order {
  _id: string
  orderNumber: string
  createdAt: string
  status: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  items: OrderItem[]
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const orderId = searchParams.get('id') || searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }
    if (sessionId) {
      verifyStripePayment()
    } else {
      fetchOrderDetails()
    }
  }, [orderId, sessionId])

  const verifyStripePayment = async () => {
    setVerifyingPayment(true)
    try {
      const res = await fetch('/api/payments/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, orderId }),
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else {
        const err = await res.json()
        setVerificationError(err.error || 'Failed to verify credit card payment.')
      }
    } catch (error) {
      setVerificationError('An unexpected error occurred during payment verification.')
    } finally {
      setVerifyingPayment(false)
      setLoading(false)
    }
  }

  const fetchOrderDetails = async () => {
    try {
      // Find orders. Since /api/orders?userId=X fetches user's orders,
      // let's fetch specific order. Wait, `/api/orders` returns an array of orders.
      // So we fetch all user's orders and find the matching ID,
      // or we can query the order directly (GET /api/orders?userId=X or similar,
      // wait, let's look at `/api/orders` GET method we wrote:
      // it returns all orders filtered by query param `userId`.
      // So we can filter by currentUserId. Let's do that:
      const res = await fetch(`/api/orders`)
      if (res.ok) {
        const data = await res.json()
        const found = data.find((o: Order) => o._id === orderId)
        if (found) {
          setOrder(found)
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order || downloadingInvoice) return
    setDownloadingInvoice(true)
    try {
      const res = await fetch(`/api/orders/${order._id}/invoice`)
      if (!res.ok) throw new Error('Failed to generate invoice')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${order.orderNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Invoice download error:', err)
    } finally {
      setDownloadingInvoice(false)
    }
  }

  // Helper to add 5-7 days to order date for delivery estimate
  const getDeliveryDateString = (dateStr: string) => {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + 5)
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString(undefined, options)
  }

  if (verifyingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-semibold">Verifying your credit card payment...</p>
        <p className="text-xs text-muted-foreground mt-2">Please do not close or refresh this page</p>
      </div>
    )
  }

  if (verificationError) {
    return (
      <Card className="border-2 text-center py-16">
        <CardContent className="flex flex-col items-center justify-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Payment Verification Failed</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {verificationError}
          </p>
          <Link href="/">
            <Button>Return to catalog</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-semibold">Loading confirmation details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <Card className="border-2 text-center py-16">
        <CardContent className="flex flex-col items-center justify-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            We couldn't retrieve the details for this order. Please verify your order number in your dashboard profile.
          </p>
          <Link href="/">
            <Button>Return to catalog</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <CheckCircle className="h-20 w-20 text-emerald-500 fill-emerald-100" />
          </motion.div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Order Confirmed!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for shopping at Jacketee. We have sent a confirmation email to{' '}
          <span className="font-semibold text-primary">{session?.user?.email || order.shippingAddress.name}</span>.
        </p>
        <div className="inline-block px-4 py-2 bg-muted/60 border rounded-full text-sm font-semibold">
          Order Number: <span className="text-primary font-bold">{order.orderNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Items Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-muted/10 p-3 rounded-lg border text-sm">
                    <div className="relative h-16 w-16 overflow-hidden rounded bg-muted flex-shrink-0">
                      <Image src={item.image || '/placeholder.png'} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variants.map((v) => `${v.name}: ${v.value}`).join(', ')}
                      </p>
                      <p className="text-xs font-medium mt-1">
                        Qty: {item.quantity} • ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base text-primary pt-1">
                  <span>Total Paid</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping details sidebar */}
        <div className="space-y-6 col-span-1">
          {/* Delivery estimate */}
          <Card className="border-2 bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Estimated Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-sm text-emerald-950">
                {getDeliveryDateString(order.createdAt)}
              </p>
              <p className="text-xs text-emerald-700/80 mt-1">
                Standard Shipping: 5-7 business days
              </p>
            </CardContent>
          </Card>

          {/* Delivery address */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-bold">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.street}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-4">
        <Link href="/" className="w-full sm:w-auto">
          <Button size="lg" className="w-full">
            Continue Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
        >
          {downloadingInvoice ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Download className="mr-2 h-5 w-5" />
          )}
          Download Invoice
        </Button>
        {session?.user ? (
          <Link href="/profile?tab=orders" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              View Order History
            </Button>
          </Link>
        ) : (
          <Link href="/track-order" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              Track This Order Later
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Fallback skeleton loader
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function ShieldAlert({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-semibold">Loading confirmation details...</p>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </main>
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Jacketee. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
