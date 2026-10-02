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
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Users as UsersIcon,
  Search,
} from 'lucide-react'

interface GuestActivityRow {
  id: string
  guestId: string
  action: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  country?: string
  region?: string
  city?: string
  createdAt: string
}

const renderActivityDetails = (activity: GuestActivityRow) => {
  const details = activity.details
  if (!details) return <span className="text-xs text-muted-foreground">N/A</span>
  return (
    <pre className="w-80 whitespace-pre-wrap break-words text-xs text-muted-foreground">
      {JSON.stringify(details, null, 2)}
    </pre>
  )
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
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
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
  }, [page, limit, actionFilter, countryFilter, guestIdFilter, from, to])

  useEffect(() => {
    if (status !== 'authenticated') return
    const timer = window.setTimeout(() => void fetchActivity(), 0)
    return () => window.clearTimeout(timer)
  }, [status, fetchActivity])

  const pageNumbers = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((value) => value >= 1 && value <= pages)
    .sort((a, b) => a - b)

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

      {/* Main Body */}
      <main className="container mx-auto min-w-0 px-4 py-8 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Guest Activity</h2>
          <p className="text-sm text-muted-foreground">
            Browsing activity from anonymous (not logged in) visitors, identified by a per-browser guest ID.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value); setPage(1) }}>
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
              onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Input
            placeholder="Filter by guest ID..."
            value={guestIdFilter}
            onChange={(e) => { setGuestIdFilter(e.target.value); setPage(1) }}
            className="w-full sm:w-56"
          />
          <Input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1) }}
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1) }}
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
            <Table className="[&_td]:align-top">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity ID</TableHead>
                  <TableHead>Guest ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {activity.id}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {activity.guestId}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatActionName(activity.action)}
                    </TableCell>
                    <TableCell>{renderActivityDetails(activity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.country || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.region || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.city || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {activity.ip || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="w-72 whitespace-normal break-words">
                        {activity.userAgent || 'N/A'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} events
              </p>
              <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1) }}>
                <SelectTrigger className="h-8 w-[118px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)} title="First page">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageNumbers.map((pageNumber, index) => (
                <div key={pageNumber} className="flex items-center gap-1">
                  {index > 0 && pageNumber - pageNumbers[index - 1] > 1 && <span className="px-1 text-muted-foreground">...</span>}
                  <Button
                    variant={pageNumber === page ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 min-w-8 px-2"
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    {pageNumber}
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage(pages)} title="Last page">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
