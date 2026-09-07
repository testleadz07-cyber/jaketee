'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  Users as UsersIcon,
  Search,
} from 'lucide-react'

interface GuestActivityRow {
  id: string
  guestId: string
  action: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  country?: string
  createdAt: string
}

const renderActivityDetails = (activity: GuestActivityRow) => {
  const details = activity.details
  if (!details) return null
  switch (activity.action) {
    case 'view_product':
      return <span className="text-xs text-muted-foreground">Product: <span className="font-semibold">{details.name || details.productId}</span></span>
    case 'view_category':
      return <span className="text-xs text-muted-foreground">Category: <span className="font-semibold">{details.name || details.slug}</span></span>
    case 'add_to_cart':
      return (
        <span className="text-xs text-muted-foreground">
          {details.name} (Qty: {details.quantity || 1}) - ${details.price?.toFixed(2)}
        </span>
      )
    case 'search':
      return <span className="text-xs text-muted-foreground">Query: &ldquo;<span className="italic">{details.query}</span>&rdquo;</span>
    default:
      return <span className="text-xs text-muted-foreground">{JSON.stringify(details)}</span>
  }
}

const formatActionName = (action: string) =>
  action.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

export default function AdminGuestActivityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activities, setActivities] = useState<GuestActivityRow[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('')
  const [guestIdFilter, setGuestIdFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (countryFilter.trim()) params.set('country', countryFilter.trim())
      if (guestIdFilter.trim()) params.set('guestId', guestIdFilter.trim())
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/admin/guest-activity?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
        setPages(data.pages || 1)
        setTotal(data.total || 0)
        setActions(data.actions || [])
      }
    } catch (error) {
      console.error('Error fetching guest activity:', error)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, countryFilter, guestIdFilter, from, to])

  useEffect(() => {
    if (status === 'authenticated') fetchActivity()
  }, [status, fetchActivity])

  useEffect(() => {
    setPage(1)
  }, [actionFilter, countryFilter, guestIdFilter, from, to])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
              <h1 className="text-2xl font-bold tracking-tight">Jacketee Admin</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logged in as <span className="font-semibold text-foreground">{session.user?.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
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
          <Link href="/admin/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          <Link href="/admin/products"><Button variant="ghost" size="sm">Products</Button></Link>
          <Link href="/admin/categories"><Button variant="ghost" size="sm">Categories</Button></Link>
          <Link href="/admin/orders"><Button variant="ghost" size="sm">Orders</Button></Link>
          <Link href="/admin/users"><Button variant="ghost" size="sm">Users</Button></Link>
          <Link href="/admin/guest-activity"><Button variant="secondary" size="sm">Guest Activity</Button></Link>
          <Link href="/admin/notifications"><Button variant="ghost" size="sm">Notifications</Button></Link>
          <Link href="/admin/subscribers"><Button variant="ghost" size="sm">Subscribers</Button></Link>
          <Link href="/admin/contact-messages"><Button variant="ghost" size="sm">Contact Messages</Button></Link>
          <Link href="/admin/analytics"><Button variant="ghost" size="sm">Analytics</Button></Link>
          <Link href="/admin/reviews"><Button variant="ghost" size="sm">Reviews</Button></Link>
          <Link href="/admin/discounts"><Button variant="ghost" size="sm">Discounts</Button></Link>
          <Link href="/admin/bulk-editor"><Button variant="ghost" size="sm">Bulk Editor</Button></Link>
          <Link href="/admin/tags"><Button variant="ghost" size="sm">Tags</Button></Link>
          <Link href="/admin/refunds"><Button variant="ghost" size="sm">Refunds</Button></Link>
          <Link href="/admin/blog"><Button variant="ghost" size="sm">Blog</Button></Link>
        </div>
      </nav>

      {/* Main Body */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Guest Activity</h2>
          <p className="text-sm text-muted-foreground">
            Browsing activity from anonymous (not logged in) visitors, identified by a per-browser guest ID.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{formatActionName(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by country..."
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            placeholder="Filter by guest ID..."
            value={guestIdFilter}
            onChange={(e) => setGuestIdFilter(e.target.value)}
            className="w-full sm:w-56"
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading guest activity...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 border-2 rounded-xl">
            <UsersIcon className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">No guest activity found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="border-2 rounded-xl overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Guest ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {activity.guestId.slice(0, 8)}&hellip;
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatActionName(activity.action)}
                    </TableCell>
                    <TableCell>{renderActivityDetails(activity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.country || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {activity.ip || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages} ({total} events)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
