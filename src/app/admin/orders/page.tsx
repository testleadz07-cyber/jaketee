'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { AdminLoadingShell } from '@/components/admin/admin-loading-shell'
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
  ClipboardList,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  FileText,
  X,
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
  paymentMethod?: string
  paymentStatus?: string
  isCustomOrder?: boolean
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

// ---------- Custom Order Form Types ----------

interface CustomOrderItem {
  id: string
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  variants: Array<{ name: string; value: string }>
  isCustom: boolean // true = manually entered, false = from catalog
}

interface CatalogProduct {
  _id: string
  id: string
  name: string
  slug: string
  price: number
  images: Array<{ url: string; alt?: string }>
  variants: Array<{ name: string; value: string; priceAdjust: number; inStock: boolean }>
  inStock: boolean
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
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Expandable row state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
  
  // Update submission status
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Tracking info form state, keyed by order id
  const [trackingForms, setTrackingForms] = useState<Record<string, { trackingNumber: string; carrier: string; estimatedDelivery: string }>>({})
  const [savingTrackingId, setSavingTrackingId] = useState<string | null>(null)

  // ---------- Create Custom Order State ----------
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStep, setCreateStep] = useState(0) // 0 = items, 1 = customer/shipping, 2 = payment/review
  const [creatingOrder, setCreatingOrder] = useState(false)

  // Customer info
  const [coCustomerName, setCoCustomerName] = useState('')
  const [coCustomerEmail, setCoCustomerEmail] = useState('')

  // Order items
  const [coItems, setCoItems] = useState<CustomOrderItem[]>([])

  // Manual item form
  const [manualName, setManualName] = useState('')
  const [manualPrice, setManualPrice] = useState('')
  const [manualQty, setManualQty] = useState('1')

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<CatalogProduct[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const productSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shipping address
  const [coShipName, setCoShipName] = useState('')
  const [coShipStreet, setCoShipStreet] = useState('')
  const [coShipCity, setCoShipCity] = useState('')
  const [coShipState, setCoShipState] = useState('')
  const [coShipZip, setCoShipZip] = useState('')
  const [coShipCountry, setCoShipCountry] = useState('United States')
  const [coShipPhone, setCoShipPhone] = useState('')

  // Payment & order details
  const [coPaymentMethod, setCoPaymentMethod] = useState('other')
  const [coPaymentStatus, setCoPaymentStatus] = useState('unpaid')
  const [coOrderStatus, setCoOrderStatus] = useState('pending')
  const [coShippingCost, setCoShippingCost] = useState('0')
  const [coTax, setCoTax] = useState('0')
  const [coNotes, setCoNotes] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (activeTab !== 'all') params.set('status', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/orders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        setTotal(Number(res.headers.get('X-Total-Count') || data.length))
        setPages(Number(res.headers.get('X-Pages') || 1))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, searchQuery])

  useEffect(() => {
    if (status === 'authenticated') fetchOrders()
  }, [status, fetchOrders])

  // Detect if db connection actually failed
  useEffect(() => {
    // If no db, stats endpoint yields "mock-1" or similar ids, and categories doesn't set id.
    // Use `total` (unfiltered count from the API) rather than the current page's
    // `orders` array, since a search/status filter can legitimately return zero
    // results without the store being in demo mode.
    const isMock = orders.some(o => o._id?.startsWith('mock') || o.id?.startsWith('mock'))
    setIsDemoMode(isMock || (total === 0 && activeTab === 'all' && !searchQuery))
  }, [orders, total, activeTab, searchQuery])

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

  const getPaymentStatusBadge = (ps?: string) => {
    switch (ps) {
      case 'paid':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">PAID</Badge>
      case 'unpaid':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]">UNPAID</Badge>
      case 'partially_paid':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-300 text-[10px]">PARTIAL</Badge>
      default:
        return null
    }
  }

  const getPaymentMethodLabel = (pm?: string) => {
    switch (pm) {
      case 'paypal': return 'PayPal'
      case 'stripe': return 'Stripe'
      case 'cash': return 'Cash'
      case 'bank_transfer': return 'Bank Transfer'
      case 'other': return 'Other'
      default: return pm || '—'
    }
  }

  // ---------- Custom Order Helpers ----------

  const resetCreateForm = () => {
    setCreateStep(0)
    setCoCustomerName('')
    setCoCustomerEmail('')
    setCoItems([])
    setManualName('')
    setManualPrice('')
    setManualQty('1')
    setProductSearch('')
    setProductResults([])
    setCoShipName('')
    setCoShipStreet('')
    setCoShipCity('')
    setCoShipState('')
    setCoShipZip('')
    setCoShipCountry('United States')
    setCoShipPhone('')
    setCoPaymentMethod('other')
    setCoPaymentStatus('unpaid')
    setCoOrderStatus('pending')
    setCoShippingCost('0')
    setCoTax('0')
    setCoNotes('')
  }

  const handleOpenCreateModal = () => {
    resetCreateForm()
    setShowCreateModal(true)
  }

  // Product catalog search (debounced)
  useEffect(() => {
    if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    if (!productSearch.trim()) {
      setProductResults([])
      setSearchingProducts(false)
      return
    }
    setSearchingProducts(true)
    productSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(productSearch.trim())}&limit=8&all=true`)
        if (res.ok) {
          const data = await res.json()
          setProductResults(data)
        }
      } catch {
        // silent
      } finally {
        setSearchingProducts(false)
      }
    }, 350)

    return () => {
      if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    }
  }, [productSearch])

  const addCatalogProduct = (product: CatalogProduct) => {
    // Check if already added
    const exists = coItems.find(i => i.productId === (product._id || product.id))
    if (exists) {
      toast({ title: 'Already added', description: `${product.name} is already in the order.` })
      return
    }
    const newItem: CustomOrderItem = {
      id: crypto.randomUUID(),
      productId: product._id || product.id,
      name: product.name,
      image: product.images?.[0]?.url || '/placeholder.svg',
      price: product.price,
      quantity: 1,
      variants: [],
      isCustom: false,
    }
    setCoItems(prev => [...prev, newItem])
    setProductSearch('')
    setProductResults([])
  }

  const addManualItem = () => {
    const price = parseFloat(manualPrice)
    const qty = parseInt(manualQty, 10)
    if (!manualName.trim() || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      toast({ title: 'Invalid item', description: 'Please provide name, valid price, and quantity.', variant: 'destructive' })
      return
    }
    const newItem: CustomOrderItem = {
      id: crypto.randomUUID(),
      productId: 'custom',
      name: manualName.trim(),
      image: '/placeholder.svg',
      price,
      quantity: qty,
      variants: [],
      isCustom: true,
    }
    setCoItems(prev => [...prev, newItem])
    setManualName('')
    setManualPrice('')
    setManualQty('1')
  }

  const updateItemQty = (itemId: string, delta: number) => {
    setCoItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta)
        return { ...i, quantity: newQty }
      }
      return i
    }))
  }

  const removeItem = (itemId: string) => {
    setCoItems(prev => prev.filter(i => i.id !== itemId))
  }

  const coSubtotal = coItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const coShippingNum = parseFloat(coShippingCost) || 0
  const coTaxNum = parseFloat(coTax) || 0
  const coTotal = coSubtotal + coShippingNum + coTaxNum

  // Step validation
  const isStep0Valid = coItems.length > 0
  const isStep1Valid = coCustomerName.trim() !== '' && coCustomerEmail.trim() !== '' &&
    coShipName.trim() !== '' && coShipStreet.trim() !== '' && coShipCity.trim() !== '' &&
    coShipState.trim() !== '' && coShipZip.trim() !== ''

  const handleCreateOrder = async () => {
    if (!isStep0Valid || !isStep1Valid) return
    setCreatingOrder(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: coCustomerName.trim(),
          customerEmail: coCustomerEmail.trim(),
          items: coItems.map(i => ({
            productId: i.productId,
            name: i.name,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            variants: i.variants,
          })),
          shippingAddress: {
            name: coShipName.trim(),
            street: coShipStreet.trim(),
            city: coShipCity.trim(),
            state: coShipState.trim(),
            zip: coShipZip.trim(),
            country: coShipCountry.trim() || 'United States',
            phone: coShipPhone.trim() || undefined,
          },
          paymentMethod: coPaymentMethod,
          paymentStatus: coPaymentStatus,
          status: coOrderStatus,
          shipping: coShippingNum,
          tax: coTaxNum,
          notes: coNotes.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: 'Custom Order Created',
          description: `Order ${data.orderNumber} has been created successfully.`,
        })
        setShowCreateModal(false)
        resetCreateForm()
        fetchOrders()
      } else {
        const err = await res.json()
        toast({
          title: 'Creation Failed',
          description: err.error || 'Failed to create custom order.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setCreatingOrder(false)
    }
  }

  const filteredOrders = orders

  if (status === 'loading' || loading) {
    return <AdminLoadingShell label="Loading orders..." />
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

  // Step indicators for the modal
  const steps = [
    { icon: <ShoppingBag className="h-4 w-4" />, label: 'Items' },
    { icon: <User className="h-4 w-4" />, label: 'Customer' },
    { icon: <CreditCard className="h-4 w-4" />, label: 'Review' },
  ]

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      {isDemoMode && orders.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs">
            <strong>Database not connected.</strong> Using read-only demo order simulator. Order status editing is disabled.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground text-sm">Manage customer orders and ship updates ({total} total)</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order #, name, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleOpenCreateModal}
            disabled={isDemoMode}
            className="gap-2 whitespace-nowrap"
            id="create-custom-order-btn"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
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
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-card border-2 border-border/40 animate-pulse p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-36 bg-muted rounded-md" />
                  <div className="h-5 w-20 bg-muted rounded-md" />
                </div>
                <div className="h-4 w-64 bg-muted/60 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
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
                        {order.isCustomOrder && (
                          <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-[10px]">CUSTOM ORDER</Badge>
                        )}
                        {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground">{order.userName}</span>
                        <span>({order.userEmail})</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {order.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{getPaymentMethodLabel(order.paymentMethod)}</span>
                          </>
                        )}
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

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {page} of {pages} ({total} orders)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}

      {/* ============================================================ */}
      {/* CREATE CUSTOM ORDER MODAL                                     */}
      {/* ============================================================ */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) setShowCreateModal(false) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" id="create-custom-order-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Create Custom Order
            </DialogTitle>
            <DialogDescription>
              Create an offsite order for a customer. Fill in the order details across the steps below.
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-1 py-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => {
                    // Allow going back freely, forward only if current step valid
                    if (idx < createStep) setCreateStep(idx)
                    if (idx === 1 && isStep0Valid) setCreateStep(1)
                    if (idx === 2 && isStep0Valid && isStep1Valid) setCreateStep(2)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full justify-center ${
                    createStep === idx
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : createStep > idx
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {createStep > idx ? <CheckCircle className="h-3.5 w-3.5" /> : step.icon}
                  {step.label}
                </button>
                {idx < steps.length - 1 && <div className="h-px bg-border flex-shrink-0 w-4" />}
              </div>
            ))}
          </div>

          <Separator />

          {/* ---- STEP 0: Order Items ---- */}
          {createStep === 0 && (
            <div className="space-y-5">
              {/* Search catalog products */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Product Catalog</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                    id="co-product-search"
                  />
                  {searchingProducts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Search Results Dropdown */}
                {productResults.length > 0 && (
                  <div className="border rounded-xl bg-card shadow-lg max-h-52 overflow-y-auto divide-y">
                    {productResults.map((p) => (
                      <button
                        key={p._id || p.id}
                        onClick={() => addCatalogProduct(p)}
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.name} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">${p.price.toFixed(2)} {!p.inStock && '• Out of stock'}</p>
                        </div>
                        <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground font-semibold">or add custom item</span></div>
              </div>

              {/* Manual custom item */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-1">
                  <Label htmlFor="co-manual-name" className="text-xs">Item Name</Label>
                  <Input
                    id="co-manual-name"
                    placeholder="Custom jacket, patch, etc."
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label htmlFor="co-manual-price" className="text-xs">Price ($)</Label>
                  <Input
                    id="co-manual-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="co-manual-qty" className="text-xs">Qty</Label>
                  <Input
                    id="co-manual-qty"
                    type="number"
                    min="1"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Button size="sm" variant="outline" onClick={addManualItem} className="w-full gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>

              {/* Items list */}
              {coItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Items ({coItems.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {coItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border">
                          {item.image && item.image !== '/placeholder.svg' ? (
                            <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            {item.isCustom && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">Custom</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQty(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQty(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm font-bold text-primary w-20 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <p className="text-sm font-semibold">Subtotal: <span className="text-primary">${coSubtotal.toFixed(2)}</span></p>
                  </div>
                </div>
              )}

              {coItems.length === 0 && (
                <div className="py-8 text-center border rounded-xl border-dashed bg-muted/20">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No items added yet. Search the catalog or add a custom item above.</p>
                </div>
              )}
            </div>
          )}

          {/* ---- STEP 1: Customer & Shipping ---- */}
          {createStep === 1 && (
            <div className="space-y-5">
              {/* Customer Info */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Customer Information
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="co-cust-name" className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="co-cust-name" placeholder="John Doe" value={coCustomerName} onChange={(e) => setCoCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-cust-email" className="text-xs">Email <span className="text-destructive">*</span></Label>
                    <Input id="co-cust-email" type="email" placeholder="john@example.com" value={coCustomerEmail} onChange={(e) => setCoCustomerEmail(e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Shipping Address
                  </Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0"
                    onClick={() => {
                      if (coCustomerName && !coShipName) setCoShipName(coCustomerName)
                    }}
                  >
                    Copy customer name
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-name" className="text-xs">Recipient Name <span className="text-destructive">*</span></Label>
                    <Input id="co-ship-name" placeholder="John Doe" value={coShipName} onChange={(e) => setCoShipName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-phone" className="text-xs">Phone</Label>
                    <Input id="co-ship-phone" placeholder="+1 (555) 123-4567" value={coShipPhone} onChange={(e) => setCoShipPhone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-ship-street" className="text-xs">Street Address <span className="text-destructive">*</span></Label>
                  <Input id="co-ship-street" placeholder="123 Main St, Suite 100" value={coShipStreet} onChange={(e) => setCoShipStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-city" className="text-xs">City <span className="text-destructive">*</span></Label>
                    <Input id="co-ship-city" placeholder="New York" value={coShipCity} onChange={(e) => setCoShipCity(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-state" className="text-xs">State <span className="text-destructive">*</span></Label>
                    <Input id="co-ship-state" placeholder="NY" value={coShipState} onChange={(e) => setCoShipState(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-zip" className="text-xs">ZIP <span className="text-destructive">*</span></Label>
                    <Input id="co-ship-zip" placeholder="10001" value={coShipZip} onChange={(e) => setCoShipZip(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="co-ship-country" className="text-xs">Country</Label>
                    <Input id="co-ship-country" placeholder="United States" value={coShipCountry} onChange={(e) => setCoShipCountry(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP 2: Payment & Review ---- */}
          {createStep === 2 && (
            <div className="space-y-5">
              {/* Payment & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="co-payment-method" className="text-xs">Payment Method</Label>
                  <select
                    id="co-payment-method"
                    value={coPaymentMethod}
                    onChange={(e) => setCoPaymentMethod(e.target.value)}
                    className="w-full bg-background border-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-payment-status" className="text-xs">Payment Status</Label>
                  <select
                    id="co-payment-status"
                    value={coPaymentStatus}
                    onChange={(e) => setCoPaymentStatus(e.target.value)}
                    className="w-full bg-background border-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-order-status" className="text-xs">Order Status</Label>
                  <select
                    id="co-order-status"
                    value={coOrderStatus}
                    onChange={(e) => setCoOrderStatus(e.target.value)}
                    className="w-full bg-background border-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Shipping & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="co-shipping-cost" className="text-xs">Shipping Cost ($)</Label>
                  <Input
                    id="co-shipping-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={coShippingCost}
                    onChange={(e) => setCoShippingCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="co-tax" className="text-xs">Tax ($)</Label>
                  <Input
                    id="co-tax"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={coTax}
                    onChange={(e) => setCoTax(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="co-notes" className="text-xs">Internal Notes</Label>
                <Textarea
                  id="co-notes"
                  placeholder="Any notes about this order (optional)..."
                  value={coNotes}
                  onChange={(e) => setCoNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Summary</h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{coCustomerName || '—'} ({coCustomerEmail || '—'})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{coItems.length} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ship To</span>
                    <span className="font-medium text-right">{coShipName ? `${coShipName}, ${coShipCity} ${coShipState}` : '—'}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${coSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{coShippingNum === 0 ? 'FREE' : `$${coShippingNum.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${coTaxNum.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold text-primary pt-1">
                    <span>Total</span>
                    <span>${coTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Nav */}
          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between pt-2">
            <div>
              {createStep > 0 && (
                <Button variant="outline" onClick={() => setCreateStep(s => s - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              {createStep < 2 ? (
                <Button
                  disabled={createStep === 0 ? !isStep0Valid : !isStep1Valid}
                  onClick={() => setCreateStep(s => s + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  disabled={creatingOrder || !isStep0Valid || !isStep1Valid}
                  onClick={handleCreateOrder}
                  className="gap-2"
                >
                  {creatingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Order
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

