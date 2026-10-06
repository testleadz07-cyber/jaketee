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
  BarChart as BarChartIcon,
  Activity,
  MousePointerClick,
  FileText,
  CalendarDays,
  Globe,
  Clock,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface GuestStatsData {
  actions: { name: string; value: number }[]
  pages: { name: string; value: number }[]
  timeline: { date: string; count: number }[]
  totalActivities: number
  uniqueActions: number
  uniquePages: number
  uniqueDays: number
  firstSeen: string | null
  lastSeen: string | null
  countries: string[]
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

const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#a855f7',
  '#f97316', '#06b6d4', '#84cc16', '#e11d48',
]

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatPageName = (name: string) => {
  if (name === 'Unknown') return 'Unknown'
  // Strip leading slash and truncate
  const clean = name.startsWith('/') ? name.slice(1) : name
  if (clean === '') return 'Home Page'
  return clean.length > 22 ? clean.substring(0, 22) + '…' : clean
}

/* ── Custom Tooltip Components ─────────────────────── */

const TimelineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{formatDateFull(label)}</p>
      <p className="text-sm font-semibold">
        {payload[0].value} {payload[0].value === 1 ? 'event' : 'events'}
      </p>
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.fill }} />
        <span className="text-xs font-medium">{formatActionName(item.name)}</span>
      </div>
      <p className="text-sm font-semibold">{item.value} events</p>
    </div>
  )
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg max-w-xs">
      <p className="text-xs font-medium text-muted-foreground mb-1 break-all">{label}</p>
      <p className="text-sm font-semibold">{payload[0].value} visits</p>
    </div>
  )
}

/* ── Custom Pie Chart Label ───────────────────────── */

const renderPieLabel = ({ name, percent }: any) => {
  if (percent < 0.05) return null
  return `${(percent * 100).toFixed(0)}%`
}

/* ── Custom Legend ────────────────────────────────── */

const PieLegend = ({ payload }: any) => {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center pt-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{formatActionName(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Summary Card ─────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Main Dialog ──────────────────────────────────── */

function GuestStatsDialog({ guestId, open, onOpenChange }: { guestId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GuestStatsData | null>(null)

  useEffect(() => {
    if (open && guestId) {
      setLoading(true)
      fetch(`/api/admin/guest-activity/stats?guestId=${guestId}`)
        .then((res) => res.json())
        .then((d) => { setData(d); setLoading(false) })
        .catch((err) => { console.error(err); setLoading(false) })
    } else {
      setData(null)
    }
  }, [open, guestId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[150vw] max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Guest Activity Overview
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{guestId}</span>
              {data && data.countries.length > 0 && (
                <span className="text-xs flex items-center gap-1 ml-2">
                  <Globe className="h-3 w-3" /> {data.countries.join(', ')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading activity data…</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <StatCard icon={Activity} label="Total Events" value={data.totalActivities} />
                <StatCard icon={MousePointerClick} label="Unique Actions" value={data.uniqueActions} />
                <StatCard icon={FileText} label="Pages Visited" value={data.uniquePages} />
                <StatCard icon={CalendarDays} label="Active Days" value={data.uniqueDays} />
                <StatCard
                  icon={Clock}
                  label="First Seen"
                  value={data.firstSeen ? formatDateTime(data.firstSeen).split(',')[0] : 'N/A'}
                  sub={data.lastSeen ? `Last: ${formatDateTime(data.lastSeen)}` : undefined}
                />
              </div>

              {/* Charts in Tabs for mobile, grid for desktop */}
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="timeline" className="text-xs sm:text-sm">📈 Timeline</TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs sm:text-sm">🎯 Actions</TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs sm:text-sm">📄 Pages</TabsTrigger>
                </TabsList>

                {/* ── Timeline ── */}
                <TabsContent value="timeline" className="mt-4">
                  <div className="border rounded-xl p-5 bg-card shadow-sm">
                    <h3 className="font-semibold text-sm mb-1">Activity Over Time</h3>
                    <p className="text-xs text-muted-foreground mb-4">Daily event count for this guest</p>
                    {data.timeline.length > 0 ? (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" fontSize={11} tickMargin={10} tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                            <YAxis fontSize={11} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                            <RechartsTooltip content={<TimelineTooltip />} />
                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No timeline data</div>
                    )}
                  </div>
                </TabsContent>

                {/* ── Actions Breakdown ── */}
                <TabsContent value="actions" className="mt-4">
                  <div className="border rounded-xl p-5 bg-card shadow-sm">
                    <h3 className="font-semibold text-sm mb-1">Action Breakdown</h3>
                    <p className="text-xs text-muted-foreground mb-4">Distribution of action types performed</p>
                    {data.actions.length > 0 ? (
                      <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.actions}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="45%"
                              outerRadius={140}
                              innerRadius={70}
                              paddingAngle={2}
                              label={renderPieLabel}
                              labelLine={false}
                            >
                              {data.actions.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<PieTooltip />} />
                            <Legend content={<PieLegend />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No action data</div>
                    )}
                  </div>
                </TabsContent>

                {/* ── Top Pages ── */}
                <TabsContent value="pages" className="mt-4">
                  <div className="border rounded-xl p-5 bg-card shadow-sm">
                    <h3 className="font-semibold text-sm mb-1">Top Pages Visited</h3>
                    <p className="text-xs text-muted-foreground mb-4">Most frequently viewed pages (top 10)</p>
                    {data.pages.length > 0 ? (
                      <div style={{ height: Math.max(300, data.pages.length * 48 + 60) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.pages} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" fontSize={11} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                            <YAxis
                              dataKey="name"
                              type="category"
                              fontSize={11}
                              width={140}
                              tickFormatter={formatPageName}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <RechartsTooltip content={<BarTooltip />} />
                            <Bar dataKey="value" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No page data</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No activity data available for this guest.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)

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
                  <TableHead className="w-[50px]"></TableHead>
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
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedGuestId(activity.guestId)} title="View Graphs">
                        <BarChartIcon className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <GuestStatsDialog guestId={selectedGuestId} open={!!selectedGuestId} onOpenChange={(open) => !open && setSelectedGuestId(null)} />

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
