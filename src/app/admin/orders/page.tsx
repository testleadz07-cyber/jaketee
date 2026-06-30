'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Inbox,
  User,
  MapPin,
  Package,
  CheckCircle,
  Truck,
  XCircle,
  ClipboardList
} from 'lucide-react'
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
  id?: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'paid' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled'
  total: number
  subtotal: number
  shipping: number
  tax: number
  items: OrderItem[]
  userName: string
  userEmail: string
  paymentId?: string
  trackingNumber?: string
  carrier?: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other'
  estimatedDelivery?: string
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

export default function AdminOrders() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  // Status filter state
  const [activeTab, setActiveTab] = useState<string>('all')
  
  // Expandable row state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
  
  // Update submission status
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Tracking info form state, keyed by order id
  const [trackingForms, setTrackingForms] = useState<Record<string, { trackingNumber: string; carrier: string; estimatedDelivery: string }>>({})
  const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        // Detect fallback mock data
        const first = data[0]
        if (first && first._id && !first.id) {
          // If first item does not have id property but has _id, it's Mongoose DB data mapping. 
          // Let's verify how stats does it: it checks the DB presence.
          // Wait, isDemoMode is checkable by seeing if database is active or mock static data has been returned.
          // Let's fetch config or just check if any orders have typical mock values.
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Detect if db connection actually failed
  useEffect(() => {
    // If no db, stats endpoint yields "mock-1" or similar ids, and categories doesn't set id.
    const isMock = orders.some(o => o._id?.startsWith('mock') || o.id?.startsWith('mock'))
    setIsDemoMode(isMock || orders.length === 0)
  }, [orders])

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Updating order status is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast({
          title: 'Order Status Updated',
          description: `Order status changed to ${newStatus.toUpperCase()}`
        })
        fetchOrders()
      } else {
        const err = await res.json()
        toast({
          title: 'Update Failed',
          description: err.error || 'Failed to update order status.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const getTrackingForm = (order: Order) => {
    const orderId = order._id || order.id || ''
    return (
      trackingForms[orderId] || {
        trackingNumber: order.trackingNumber || '',
        carrier: order.carrier || '',
        estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : '',
      }
    )
  }

  const updateTrackingForm = (orderId: string, field: 'trackingNumber' | 'carrier' | 'estimatedDelivery', value: string) => {
    setTrackingForms(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { trackingNumber: '', carrier: '', estimatedDelivery: '' }),
        [field]: value,
      },
    }))
  }

  const handleSaveTracking = async (order: Order) => {
    const orderId = order._id || order.id || ''
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Updating tracking info is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    const form = getTrackingForm(order)
    setSavingTrackingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: form.trackingNumber || undefined,
          carrier: form.carrier || undefined,
          estimatedDelivery: form.estimatedDelivery || undefined,
        })
      })

      if (res.ok) {
        toast({
          title: 'Tracking Info Updated',
          description: 'Carrier and tracking number saved for this order.'
        })
        fetchOrders()
      } else {
        const err = await res.json()
        toast({
          title: 'Update Failed',
          description: err.error || 'Failed to update tracking info.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setSavingTrackingId(null)
    }
  }

  const getStatusBadge = (orderStatus: string) => {
    switch (orderStatus.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">PENDING</Badge>
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">PAID</Badge>
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">SHIPPED</Badge>
      case 'in_transit':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">IN TRANSIT</Badge>
      case 'delivered':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">DELIVERED</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">CANCELLED</Badge>
      default:
        return <Badge variant="outline">{orderStatus.toUpperCase()}</Badge>
    }
  }

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true
    return o.status.toLowerCase() === activeTab.toLowerCase()
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-semibold">Access Denied. Admins Only.</p>
          <Link href="/">
            <Button className="mt-4">Back to Storefront</Button>
          </Link>
        </div>
      </div>
    )
  }

  const tabsList = ['all', 'pending', 'paid', 'shipped', 'in_transit', 'delivered', 'cancelled']

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">LUXE STORE Admin</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logged in as <span className="font-semibold text-foreground">{session.user?.email}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <nav className="bg-background border-b py-2 sticky top-[73px] z-10">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">Products</Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" size="sm">Categories</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="secondary" size="sm">Orders</Button>
          </Link>
          <Link href="/admin/reviews">
            <Button variant="ghost" size="sm">Reviews</Button>
          </Link>
          <Link href="/admin/discounts">
            <Button variant="ghost" size="sm">Discounts</Button>
          </Link>
          <Link href="/admin/bulk-editor">
            <Button variant="ghost" size="sm">Bulk Editor</Button>
          </Link>
          <Link href="/admin/tags">
            <Button variant="ghost" size="sm">Tags</Button>
          </Link>
          <Link href="/admin/refunds">
            <Button variant="ghost" size="sm">Refunds</Button>
          </Link>
        </div>
      </nav>

      {/* Main Body */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && orders.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs">
              <strong>Database not connected.</strong> Using read-only demo order simulator. Order status editing is disabled.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Orders</h2>
            <p className="text-muted-foreground text-sm">Manage customer orders and ship updates</p>
          </div>
        </div>

        {/* Status Filters sub-tabs */}
        <div className="flex border-b overflow-x-auto gap-2 py-1 select-none">
          {tabsList.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize border-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'in_transit' ? 'In Transit' : tab}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const orderId = order._id || order.id || ''
              const isExpanded = expandedOrders[orderId] || false
              const isUpdating = updatingId === orderId

              return (
                <Card key={orderId} className={`border-2 overflow-hidden bg-card ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}>
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(orderId)}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lg">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground">{order.userName}</span>
                        <span>({order.userEmail})</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground">Order Total</p>
                        <p className="text-lg font-bold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Collapsible section */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10">
                      <div className="p-6 space-y-6">
                        {/* Quick Update Dropdown */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border/50 justify-between">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Update Order Progress Status:
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              disabled={isUpdating || isDemoMode}
                              onChange={(e) => handleStatusUpdate(orderId, e.target.value)}
                              className="bg-background border-2 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="pending">Pending Payment</option>
                              <option value="paid">Paid (Order Placed)</option>
                              <option value="shipped">Shipped</option>
                              <option value="in_transit">In Transit</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
                          </div>
                        </div>

                        {/* Carrier & Tracking Info */}
                        <div className="bg-muted/50 p-4 rounded-xl border border-border/50 space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Truck className="h-4 w-4" /> Carrier & Tracking Information
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Carrier</label>
                              <select
                                value={getTrackingForm(order).carrier}
                                disabled={isDemoMode}
                                onChange={(e) => updateTrackingForm(orderId, 'carrier', e.target.value)}
                                className="w-full bg-background border-2 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <option value="">Select carrier</option>
                                <option value="UPS">UPS</option>
                                <option value="FedEx">FedEx</option>
                                <option value="USPS">USPS</option>
                                <option value="DHL">DHL</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Tracking Number</label>
                              <input
                                type="text"
                                value={getTrackingForm(order).trackingNumber}
                                disabled={isDemoMode}
                                onChange={(e) => updateTrackingForm(orderId, 'trackingNumber', e.target.value)}
                                placeholder="e.g. 1Z999AA10123456784"
                                className="w-full bg-background border-2 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Estimated Delivery</label>
                              <input
                                type="date"
                                value={getTrackingForm(order).estimatedDelivery}
                                disabled={isDemoMode}
                                onChange={(e) => updateTrackingForm(orderId, 'estimatedDelivery', e.target.value)}
                                className="w-full bg-background border-2 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isDemoMode || savingTrackingId === orderId}
                              onClick={() => handleSaveTracking(order)}
                            >
                              {savingTrackingId === orderId ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Save Tracking Info
                            </Button>
                          </div>
                        </div>

                        {/* Summary details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Items Table */}
                          <div className="lg:col-span-2 space-y-3">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Package className="h-4 w-4" /> Ordered Items ({order.items.length})
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center bg-card p-3 rounded-xl border">
                                  <div className="relative h-14 w-14 overflow-hidden rounded bg-muted flex-shrink-0 border">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{item.name}</p>
                                    {item.variants && item.variants.length > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.variants.map((v) => `${v.name}: ${v.value}`).join(', ')}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Qty: {item.quantity} • ${item.price.toFixed(2)} each
                                    </p>
                                  </div>
                                  <div className="text-right font-bold text-sm text-primary">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Customer / Address / Totals */}
                          <div className="space-y-6">
                            {/* Address details */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" /> Shipping Address
                              </h4>
                              <div className="text-sm p-4 rounded-xl border bg-card space-y-1 leading-relaxed">
                                <p className="font-semibold">{order.shippingAddress.name}</p>
                                <p className="text-muted-foreground">{order.shippingAddress.street}</p>
                                <p className="text-muted-foreground text-xs">
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                                </p>
                                <p className="text-muted-foreground text-xs">{order.shippingAddress.country}</p>
                                {order.shippingAddress.phone && (
                                  <p className="text-muted-foreground text-xs mt-1.5 pt-1.5 border-t">Phone: {order.shippingAddress.phone}</p>
                                )}
                              </div>
                            </div>

                            {/* Additional metadata */}
                            {order.paymentId && (
                              <div className="space-y-2">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <ClipboardList className="h-4 w-4" /> Transaction ID
                                </h4>
                                <div className="text-xs p-3 font-mono rounded-lg border bg-card break-all text-muted-foreground select-all">
                                  {order.paymentId}
                                </div>
                              </div>
                            )}

                            {/* Totals */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order Totals</h4>
                              <div className="p-4 rounded-xl border bg-card text-sm space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span>${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>{order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tax</span>
                                  <span>${order.tax?.toFixed(2) || '0.00'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base text-primary pt-1">
                                  <span>Total Amount</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          ) : (
            <div className="py-20 text-center border rounded-xl bg-card border-dashed">
              <Inbox className="h-12 w-12 text-muted-foreground opacity-65 mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">No orders found matching this filter</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
