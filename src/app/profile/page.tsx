'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { User, ShoppingBag, Heart, Loader2, ChevronDown, ChevronUp, Package, ShieldCheck, Mail, Phone, Calendar, MapPin, DollarSign, Trash2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useWishlistStore } from '@/store/wishlist'
import { useCartStore } from '@/store/cart'
import { Breadcrumbs } from '@/components/breadcrumbs'

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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  subtotal: number
  shipping: number
  tax: number
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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)

  const wishlistItems = useWishlistStore((state) => state.items)
  const loadWishlist = useWishlistStore((state) => state.loadFromServer)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const addToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Handle tab from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam === 'wishlist' || tabParam === 'orders' || tabParam === 'profile') {
        setActiveTab(tabParam)
      }
    }
  }, [status])

  // Fetch profile, orders, and wishlist if logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || '')
      fetchProfile()
      fetchOrders()
      loadWishlist((session.user as any).id)
    }
  }, [status, session, loadWishlist])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile')
      if (res.ok) {
        const data = await res.json()
        setName(data.name || '')
        setPhone(data.phone || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchOrders = async () => {
    setIsOrdersLoading(true)
    try {
      const userId = (session?.user as any)?.id
      if (!userId) return

      const res = await fetch(`/api/orders?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsOrdersLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileLoading(true)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        })
      } else {
        const data = await res.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to update profile',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordLoading(true)

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      })
      setIsPasswordLoading(false)
      return
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to change password',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading your dashboard...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <Breadcrumbs items={[{ label: 'Profile' }]} className="mb-6" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
              <p className="text-muted-foreground">
                Manage your profile, passwords, and view your order history
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border-2">
              <User className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-semibold">{session.user?.name}</p>
                <p className="text-muted-foreground text-xs">{session.user?.email}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 max-w-md w-full border-b">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Edit */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your name and phone number below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email Address</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={session.user?.email || ''}
                          disabled
                          className="bg-muted opacity-80 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-muted-foreground">Email address cannot be changed</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input
                          id="profile-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isProfileLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-phone">Phone Number</Label>
                        <Input
                          id="profile-phone"
                          type="text"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isProfileLoading}
                        />
                      </div>

                      <Button type="submit" disabled={isProfileLoading}>
                        {isProfileLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Password Change */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Protect your account with a secure password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={isPasswordLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={isPasswordLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <Input
                          id="confirm-new-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isPasswordLoading}
                        />
                      </div>

                      <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              {isOrdersLoading ? (
                <div className="flex flex-col justify-center items-center py-12 bg-card border-2 rounded-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading order history...</p>
                </div>
              ) : orders.length === 0 ? (
                <Card className="border-2 text-center py-16">
                  <CardContent className="flex flex-col items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground opacity-60 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      You haven't placed any orders yet. Visit our store to find your first favorite item!
                    </p>
                    <Link href="/">
                      <Button>Start Shopping</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders[order._id] || false
                    return (
                      <Card key={order._id} className="border-2 overflow-hidden bg-card">
                        {/* Order Header Summary */}
                        <div
                          onClick={() => toggleExpandOrder(order._id)}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 cursor-pointer hover:bg-muted/30 transition-colors select-none gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-lg">{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Total Amount</p>
                              <p className="text-lg font-bold text-primary">${order.total.toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Order Details (Expandable) */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t"
                            >
                              <div className="p-6 bg-muted/10 space-y-6">
                                {/* Items Table */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                    Ordered Items
                                  </h4>
                                  <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex gap-4 items-center bg-card p-3 rounded-lg border">
                                        <div className="relative h-16 w-16 overflow-hidden rounded bg-muted flex-shrink-0">
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="object-cover w-full h-full"
                                          />
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
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Summary & Shipping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Shipping Address */}
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                      Shipping Address
                                    </h4>
                                    <div className="text-sm p-4 rounded-lg border bg-card space-y-1">
                                      <p className="font-semibold">{order.shippingAddress.name}</p>
                                      <p className="text-muted-foreground">{order.shippingAddress.street}</p>
                                      <p className="text-muted-foreground">
                                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                                      </p>
                                      <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                                    </div>
                                  </div>

                                  {/* Payment Summary */}
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                      Payment Summary
                                    </h4>
                                    <div className="p-4 rounded-lg border bg-card text-sm space-y-2">
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
                                      <div className="flex justify-between font-bold text-lg text-primary pt-1">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-6">
              {wishlistItems.length === 0 ? (
                <Card className="border-2 text-center py-16">
                  <CardContent className="flex flex-col items-center justify-center">
                    <Heart className="h-16 w-16 text-muted-foreground opacity-60 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Save items you love here to find them easily and add them to your cart later.
                    </p>
                    <Link href="/">
                      <Button>Explore Products</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlistItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-2 flex flex-col h-full hover:border-primary transition-all duration-300">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                          <p className="text-xl font-bold text-primary">${item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromWishlist(item.productId, (session.user as any).id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => {
                              addToCart({
                                productId: item.productId,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                variants: [{ name: 'Standard', value: 'Default' }],
                                quantity: 1,
                              })
                              toast({
                                title: 'Added to cart',
                                description: `${item.name} added to your cart.`,
                              })
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Luxe Store. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
