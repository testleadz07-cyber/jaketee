'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ShoppingBag,
  Package,
  DollarSign,
  LogOut,
  Plus,
  ChevronLeft,
  Users,
  Loader2,
  ListCollapse,
  Layers,
  ArrowUpRight,
  TableProperties,
  Tags,
  RotateCcw,
  AlertOctagon
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  customerCount: number
  revenueChart: Array<{ date: string; revenue: number; orders: number }>
  statusSplit: Array<{ name: string; value: number }>
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number; image: string }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    createdAt: string
    status: string
    total: number
    userEmail: string
    userName: string
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeGateway, setActiveGateway] = useState<string>('both')
  const [isSettingsSaving, setIsSettingsSaving] = useState(false)
  const fetchGuard = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && !fetchGuard.current) {
      fetchGuard.current = true
      fetchStats()
      fetchGatewaySettings()
    }
  }, [status])

  const fetchGatewaySettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.payment_gateway) {
          setActiveGateway(data.payment_gateway)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleUpdateGateway = async (gatewayValue: string) => {
    setIsSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'payment_gateway', value: gatewayValue }),
      })
      if (res.ok) {
        setActiveGateway(gatewayValue)
        toast({
          title: 'Settings Updated',
          description: `Payment gateway configured to: ${gatewayValue.toUpperCase()}`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update gateway configurations.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to communicate with server.',
        variant: 'destructive',
      })
    } finally {
      setIsSettingsSaving(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin analytics...</p>
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

  const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ]

  const getStatusBadgeClass = (orderStatus: string) => {
    switch (orderStatus.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800'
      case 'cancelled':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

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
            <Button variant="secondary" size="sm">Dashboard</Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">Products</Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" size="sm">Categories</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">Orders</Button>
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
      <main className="container mx-auto px-4 py-8 flex-1 space-y-8">
        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">${stats?.totalRevenue.toFixed(2)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Excludes cancelled orders</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.totalOrders}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Orders placed in total</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.totalProducts}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Fashion items listed</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Customers</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.customerCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Customer profiles created</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Gateway Settings Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Payment Gateway Options</CardTitle>
            <CardDescription>Configure which checkout payment methods are active for your store</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Active Payment Gateways</p>
              <p className="text-xs text-muted-foreground">Select between Stripe Checkout (Credit Cards), PayPal payments, or both active simultaneously.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeGateway === 'paypal' ? 'default' : 'outline'}
                onClick={() => handleUpdateGateway('paypal')}
                disabled={isSettingsSaving}
                size="sm"
              >
                PayPal Only
              </Button>
              <Button
                variant={activeGateway === 'stripe' ? 'default' : 'outline'}
                onClick={() => handleUpdateGateway('stripe')}
                disabled={isSettingsSaving}
                size="sm"
              >
                Stripe Only
              </Button>
              <Button
                variant={activeGateway === 'both' ? 'default' : 'outline'}
                onClick={() => handleUpdateGateway('both')}
                disabled={isSettingsSaving}
                size="sm"
              >
                Both Active
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">Quick Settings</h2>
            <p className="text-sm text-muted-foreground">Jump directly to inventory &amp; store management tools</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/bulk-editor" className="group">
              <Card className="border-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                      <TableProperties className="h-5 w-5 text-blue-600" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Bulk Product Editor</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Edit stock, pricing &amp; visibility for all products at once</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/tags" className="group">
              <Card className="border-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 group-hover:bg-violet-100 transition-colors">
                      <Tags className="h-5 w-5 text-violet-600" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Tags &amp; Collections</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage product tags like &quot;New Arrival&quot; or &quot;Summer Sale&quot;</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/refunds" className="group">
              <Card className="border-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 group-hover:bg-rose-100 transition-colors">
                      <RotateCcw className="h-5 w-5 text-rose-600" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Refund &amp; Returns</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Review and process customer return requests</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/products" className="group">
              <Card className="border-2 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                      <AlertOctagon className="h-5 w-5 text-amber-600" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Low-Stock Alerts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">View products flagged for low inventory levels</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Area Chart */}
          <Card className="lg:col-span-2 border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Daily revenue trends for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {stats?.revenueChart && stats.revenueChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{ background: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Splits Pie Chart */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
              <CardDescription>Visual distribution of order states</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-[250px] w-full relative">
                {stats?.statusSplit && stats.statusSplit.some(s => s.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusSplit.filter(s => s.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusSplit.filter(s => s.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Orders']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No orders recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest 5 Orders */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest order placements across the store</CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button size="sm" variant="ghost" className="gap-1">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{order.orderNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(order.status)}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.userName} ({order.userEmail})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">${order.total.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No recent orders.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Most popular items based on quantity sold</CardDescription>
              </div>
              <Link href="/admin/products">
                <Button size="sm" variant="ghost" className="gap-1">
                  Manage <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">${product.revenue.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No products found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}