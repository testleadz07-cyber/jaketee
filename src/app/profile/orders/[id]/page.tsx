'use client'

import { useCustomerJson } from '@/hooks/use-customer-json'
import { apiFetch as fetch } from '@/lib/api-fetch'

import { Footer } from '@/components/footer'
import { PageLoading } from '@/components/page-loading'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState  } from 'react'
import Image from '@/components/optimized-image'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { OrderCustomizationDetails } from '@/components/order-customization-details'
import type { JacketCustomization } from '@/types/jacket-customization'
import {
  Loader2,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  XCircle,
  Circle,
  ExternalLink,
  ClipboardList,
  Download,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  customization?: JacketCustomization
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variants: Array<{ name: string; value: string }>
}

interface StatusHistoryEntry {
  status: string
  timestamp: string
  note?: string
}

interface OrderDetail {
  _id: string
  id?: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'paid' | 'in_production' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled'
  total: number
  subtotal: number
  shipping: number
  tax: number
  items: OrderItem[]
  trackingNumber?: string
  carrier?: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other'
  estimatedDelivery?: string
  statusHistory?: StatusHistoryEntry[]
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
  }
}

// Carrier tracking URL patterns for known carriers
const carrierTrackingUrl = (carrier: string | undefined, trackingNumber: string) => {
  switch (carrier) {
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`
    case 'FedEx':
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`
    case 'DHL':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`
    default:
      return null
  }
}

// Map raw order status to the customer-facing progression step
const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: ClipboardList },
  { key: 'in_production', label: 'In Production', icon: Settings },
  { key: 'shipped', label: 'Shipped', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

const statusToStepIndex = (status: string) => {
  switch (status) {
    case 'pending':
    case 'paid':
      return 0
    case 'in_production':
      return 1
    case 'shipped':
      return 2
    case 'in_transit':
      return 3
    case 'delivered':
      return 4
    default:
      return 0
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'in_production':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'delivered':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export default function OrderTrackingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const ownerId = status === 'authenticated' ? (session?.user as { id?: string } | undefined)?.id : undefined
  const { data: order, loading, error, retry } = useCustomerJson<OrderDetail>(ownerId,
    orderId ? `/api/orders/${encodeURIComponent(orderId)}` : null, 'object')
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleDownloadInvoice = async () => {
    if (!order || downloadingInvoice) return
    setDownloadingInvoice(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`)
      if (!res.ok) {
        throw new Error('Failed to generate invoice')
      }
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

  if (status === 'loading' || loading) {
    return <PageLoading label="Loading order tracking…" />
  }

  if (!session) {
    return null
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">{error ? 'Unable to load order' : 'Order Not Found'}</h1>
          <p className="text-muted-foreground mb-6">{error || 'We could not find this order.'}</p>
          {error && <Button onClick={retry} className="mb-4 mr-3">Retry order</Button>}
          <Link href="/profile?tab=orders">
            <Button>Back to My Orders</Button>
          </Link>
        </main>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const currentStep = statusToStepIndex(order.status)
  const trackingUrl = order.trackingNumber ? carrierTrackingUrl(order.carrier, order.trackingNumber) : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: 'Profile', href: '/profile?tab=orders' },
            { label: `Order ${order.orderNumber}` },
          ]}
          className="mb-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Order {order.orderNumber}</h1>
              <p className="text-muted-foreground text-sm">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
              >
                {downloadingInvoice ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download Invoice
              </Button>
            </div>
          </div>

          {/* Tracking Stepper */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 text-rose-800 border border-rose-500/20">
                  <XCircle className="h-6 w-6 flex-shrink-0" />
                  <p className="text-sm font-medium">This order has been cancelled.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Desktop: horizontal stepper */}
                  <div className="hidden sm:flex items-center">
                    {STEPS.map((step, idx) => {
                      const StepIcon = step.icon
                      const isActive = idx === currentStep
                      const isDone = idx <= currentStep
                      return (
                        <div key={step.key} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isDone
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'bg-muted border-border text-muted-foreground'
                              } ${isActive ? 'ring-4 ring-primary/20' : ''}`}
                            >
                              <StepIcon className="h-5 w-5" />
                            </div>
                            <span
                              className={`text-xs font-semibold text-center max-w-[90px] ${
                                isDone ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                idx < currentStep ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Mobile: vertical stepper */}
                  <div className="flex sm:hidden flex-col gap-0">
                    {STEPS.map((step, idx) => {
                      const StepIcon = step.icon
                      const isActive = idx === currentStep
                      const isDone = idx <= currentStep
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isDone
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'bg-muted border-border text-muted-foreground'
                              } ${isActive ? 'ring-4 ring-primary/20' : ''}`}
                            >
                              <StepIcon className="h-4 w-4" />
                            </div>
                            {idx < STEPS.length - 1 && (
                              <div
                                className={`w-1 flex-1 min-h-[24px] rounded-full transition-colors ${
                                  idx < currentStep ? 'bg-primary' : 'bg-border'
                                }`}
                              />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={`text-sm font-semibold ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carrier & Tracking Info */}
          {(order.trackingNumber || order.carrier || order.estimatedDelivery) && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Carrier & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {order.carrier && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Carrier</p>
                      <p className="font-semibold">{order.carrier}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Tracking Number</p>
                      {trackingUrl ? (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {order.trackingNumber}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <p className="font-mono font-semibold select-all">{order.trackingNumber}</p>
                      )}
                    </div>
                  )}
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Estimated Delivery</p>
                      <p className="font-semibold">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <Circle className="h-2.5 w-2.5 mt-1.5 text-primary fill-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{entry.status.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {entry.note && <p className="text-muted-foreground text-xs mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items & Address */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Ordered Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap gap-4 items-start bg-card p-3 rounded-lg border">
                    <div className="relative h-16 w-16 overflow-hidden rounded bg-muted flex-shrink-0">
                      <Image src={item.image || '/placeholder.png'} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.name}</p>
                      {item.variants && item.variants.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.variants.map((v) => `${v.name}: ${v.value}`).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-medium mt-1">
                        Qty: {item.quantity} • ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <OrderCustomizationDetails customization={item.customization} name={item.name} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-semibold">{order.shippingAddress.name}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.street}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Order Totals</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base text-primary pt-1">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 mt-2"
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                  >
                    {downloadingInvoice ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download Invoice / Receipt
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
