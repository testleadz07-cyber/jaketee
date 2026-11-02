'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { guestActivityParams, parseGuestActivityFilters, type GuestActivityFilters, type GuestActivityListData } from '@/lib/guest-activity-list'
import { ActivityDevice } from '@/components/admin/activity-device'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
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
  ChevronDown,
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
import { isGuestStatsData, isGuestActivityList } from '@/lib/guest-activity-response'
import { ACTIVITY_REPORTING_TIMEZONE } from '@/lib/guest-activity-query'
import { guestFormLabels, isGuestFormAction, type GuestFormName } from '@/lib/guest-form-schema'

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
  if (isGuestFormAction(activity.action)) {
    const form = typeof details.form === 'string' && Object.hasOwn(guestFormLabels, details.form) ? guestFormLabels[details.form as GuestFormName] : 'Guest form'
    const fields = details.fields && typeof details.fields === 'object' && !Array.isArray(details.fields) ? Object.entries(details.fields).filter(([, value]) => typeof value === 'string') : []
    return <div className="w-64 space-y-2 whitespace-normal text-xs [overflow-wrap:anywhere] sm:w-80">
      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{form}</span><span className="rounded-full bg-muted px-2 py-1">{activity.action === 'guest_form_submitted' ? 'Reported submission' : 'Draft / unconfirmed'}</span></div>
      <p className="break-all text-muted-foreground">{typeof details.path === 'string' ? details.path : ''}</p>
      {typeof details.capturedAt === 'string' && <p className="text-muted-foreground">Last update: {formatDateTime(details.capturedAt)}</p>}
      <details className="rounded-md border p-2"><summary className="cursor-pointer font-medium">{fields.length ? `View ${fields.length} saved fields` : 'No saved fields'}</summary>
        <dl tabIndex={0} aria-label="Saved guest form fields" className="mt-3 max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">{fields.map(([key, value]) => <div key={key}><dt className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-1 whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">{String(value)}</dd></div>)}</dl>
        {details.truncated === true && <p className="mt-2 text-muted-foreground">Long entries were shortened for the activity snapshot.</p>}
      </details>
      <p className="text-muted-foreground">Guest analytics snapshot; a reported submission does not confirm payment or server acceptance.</p>
    </div>
  }
  return (
    <pre tabIndex={0} className="max-h-72 w-64 overflow-y-auto overscroll-contain whitespace-pre-wrap text-xs text-muted-foreground [overflow-wrap:anywhere] sm:w-80">
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
  const d = new Date(dateStr + 'T00:00:00+05:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: ACTIVITY_REPORTING_TIMEZONE })
}

const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00+05:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: ACTIVITY_REPORTING_TIMEZONE })
}

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: ACTIVITY_REPORTING_TIMEZONE }) + ' PKT'
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
    <div className="flex max-h-28 flex-wrap justify-center gap-x-4 gap-y-1.5 overflow-y-auto pt-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex min-w-0 max-w-full items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground [overflow-wrap:anywhere]">{formatActionName(entry.value)}</span>
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

function GuestStatsDialog({ guestId, open, onOpenChange, from, to }: { guestId: string | null; open: boolean; onOpenChange: (open: boolean) => void; from: string; to: string }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GuestStatsData | null>(null)

  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => {
      setData(null)
      setError('')
      if (!open || !guestId) { setLoading(false); return }
      setLoading(true)
      const params = new URLSearchParams({ guestId })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      void fetch(`/api/admin/guest-activity/stats?${params}`, { signal: controller.signal })
        .then(async res => {
          const value = await res.json()
          if (!res.ok) throw new Error(value.error || 'Unable to load guest statistics')
          if (!isGuestStatsData(value)) throw new Error('Invalid statistics response')
          if (active) setData(value)
        })
        .catch(err => { if (active && err.name !== 'AbortError') setError(err.message) })
        .finally(() => { if (active) setLoading(false) })
    }, 0)
    return () => { active = false; window.clearTimeout(timer); controller.abort() }
  }, [open, guestId, from, to, retry])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-7xl flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        {/* Header */}
        <div className="shrink-0 border-b bg-background px-4 py-4 pr-12 sm:px-6 sm:pr-14">
          <DialogHeader className="min-w-0 text-left">
            <DialogTitle className="flex items-center gap-2 text-base leading-snug sm:text-lg">
              <Activity className="h-5 w-5 shrink-0 text-primary" />
              Guest Activity Overview
            </DialogTitle>
            <DialogDescription className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="max-w-full break-all rounded bg-muted px-2 py-0.5 font-mono text-xs">{guestId}</span>
              {data && data.countries.length > 0 && (
                <span className="flex min-w-0 items-start gap-1 text-xs [overflow-wrap:anywhere]">
                  <Globe className="h-3 w-3 shrink-0" /> {data.countries.join(', ')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div role="region" aria-label="Guest activity charts and summary" tabIndex={0} className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:space-y-6 sm:p-6">
          {error ? (
            <div role="alert" className="py-8 text-center space-y-3">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Retry</Button>
            </div>
          ) : loading ? (
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
                  label="First Seen in Range"
                  value={data.firstSeen ? formatDateTime(data.firstSeen).split(',')[0] : 'N/A'}
                  sub={data.lastSeen ? `Last: ${formatDateTime(data.lastSeen)}` : undefined}
                />
              </div>

              {/* Charts in Tabs for mobile, grid for desktop */}
              <Tabs defaultValue="timeline" className="min-w-0 w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="timeline" className="text-xs sm:text-sm">📈 Timeline</TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs sm:text-sm">🎯 Actions</TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs sm:text-sm">📄 Pages</TabsTrigger>
                </TabsList>

                {/* ── Timeline ── */}
                <TabsContent value="timeline" className="mt-4">
                  <div className="min-w-0 rounded-xl border bg-card p-3 shadow-sm sm:p-5">
                    <h3 className="font-semibold text-sm mb-1">Activity Over Time</h3>
                    <p className="text-xs text-muted-foreground mb-4">Daily event count in Pakistan time (PKT); selected date range or the last 90 days</p>
                    {data.timeline.length > 0 ? (
                      <div className="h-64 min-w-0 sm:h-96">
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
                  <div className="min-w-0 rounded-xl border bg-card p-3 shadow-sm sm:p-5">
                    <h3 className="font-semibold text-sm mb-1">Action Breakdown</h3>
                    <p className="text-xs text-muted-foreground mb-4">Distribution of action types performed</p>
                    {data.actions.length > 0 ? (
                      <div className="h-80 min-w-0 sm:h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.actions}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="45%"
                              outerRadius="75%"
                              innerRadius="40%"
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
                  <div className="min-w-0 rounded-xl border bg-card p-3 shadow-sm sm:p-5">
                    <h3 className="font-semibold text-sm mb-1">Top Pages Visited</h3>
                    <p className="text-xs text-muted-foreground mb-4">Recorded page views (top 10); legacy events without page views are excluded</p>
                    {data.pages.length > 0 ? (
                      <div className="min-w-0" style={{ height: Math.max(300, data.pages.length * 48 + 60) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.pages} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" fontSize={11} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                            <YAxis
                              dataKey="name"
                              type="category"
                              fontSize={11}
                              width={90}
                              tickFormatter={(name: string) => { const label = formatPageName(name); return label.length > 12 ? `${label.slice(0, 12)}…` : label }}
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

export default function GuestActivityClient({ initialFilters, initialData, initialError = '' }: {
  initialFilters: GuestActivityFilters; initialData: GuestActivityListData; initialError?: string
}) {
  // Session updates only hide revoked access; they never trigger list reads.
  const { data: session, status } = useSession()
  const [result, setResult] = useState(initialData)
  const [draft, setDraft] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const requestNumber = useRef(0)
  const pending = useRef<AbortController | null>(null)
  const lastRequest = useRef({ filters: initialFilters, options: true, history: 'replace' as 'push' | 'replace' | 'none', updateDraft: false })
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const { activities, actions, countries, pages, total } = result
  const { page, limit } = applied
  const { action: actionFilter, country: countryFilter, excludedCountries, guestId: guestIdFilter, from, to } = draft
  const setActionFilter = (action: string) => setDraft(current => ({ ...current, action }))
  const setCountryFilter = (country: string) => setDraft(current => ({ ...current, country }))
  const setGuestIdFilter = (guestId: string) => setDraft(current => ({ ...current, guestId }))
  const setFrom = (from: string) => setDraft(current => ({ ...current, from }))
  const setTo = (to: string) => setDraft(current => ({ ...current, to }))
  const setLimit = (limit: number) => setDraft(current => ({ ...current, limit }))
  const setExcludedCountries = (value: string[] | ((current: string[]) => string[])) => setDraft(current => ({
    ...current, excludedCountries: typeof value === 'function' ? value(current.excludedCountries) : value,
  }))

  const fetchActivity = useCallback(async (target: GuestActivityFilters, options = true, history: 'push' | 'replace' | 'none' = 'replace', updateDraft = false) => {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    const number = ++requestNumber.current
    lastRequest.current = { filters: target, options, history, updateDraft }
    setLoading(true)
    setError('')
    try {
      const normalized = parseGuestActivityFilters(guestActivityParams(target))
      const params = guestActivityParams(normalized)
      if (!options) params.set('options', '0')
      const res = await fetch(`/api/admin/guest-activity?${params}`, {
        cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      })
      const data = await res.json().catch(() => null)
      if (controller.signal.aborted || number !== requestNumber.current) return
      if (!res.ok) throw new Error(data?.error || 'Unable to load guest activity')
      if (!isGuestActivityList(data) || !Number.isSafeInteger(data.page) || data.page < 1) throw new Error('Invalid activity response')
      const next = { ...normalized, page: data.page }
      setResult(previous => ({ ...data, actions: options ? data.actions : previous.actions, countries: options ? data.countries : previous.countries }))
      setApplied(next)
      if (updateDraft) setDraft(next)
      setSelectedGuestId(null)
      if (history !== 'none') {
        const url = new URL(window.location.href)
        url.search = guestActivityParams(next).toString()
        if (url.href !== window.location.href) window.history[history === 'push' ? 'pushState' : 'replaceState'](null, '', url)
      }
    } catch (cause) {
      if (!controller.signal.aborted && number === requestNumber.current) {
        setError(cause instanceof Error && cause.name !== 'TimeoutError' ? cause.message : 'Request timed out. Previous results have been kept; please retry.')
      }
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false) }
    }
  }, [])

  // Listener setup only: no data fetch on mount, session updates, timers or focus.
  // Back/Forward is explicit navigation, so it loads the selected URL once.
  useEffect(() => {
    const navigate = () => {
      try {
        const filters = parseGuestActivityFilters(new URLSearchParams(window.location.search), true)
        pending.current?.abort(); pending.current = null; requestNumber.current++
        setDraft(filters)
        void fetchActivity(filters, false, 'none')
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid filters') }
    }
    window.addEventListener('popstate', navigate)
    return () => { window.removeEventListener('popstate', navigate); pending.current?.abort(); pending.current = null; requestNumber.current++ }
  }, [fetchActivity])

  const setPage = (value: number | ((page: number) => number)) => {
    const next = typeof value === 'function' ? value(page) : value
    if (next !== page) void fetchActivity({ ...applied, page: next }, false, 'push')
  }
  const unapplied = JSON.stringify({ ...draft, page: 1 }) !== JSON.stringify({ ...applied, page: 1 })

  const pageNumbers = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((value) => value >= 1 && value <= pages)
    .sort((a, b) => a - b)

  if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'admin')) {
    return <div role="alert" className="p-8 text-destructive">Admin access is required. Please sign in again.</div>
  }

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">

      {/* Main Body */}
      <main className="container mx-auto min-w-0 px-4 py-8 flex-1 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={loading} onClick={() => void fetchActivity(applied, true)}>Refresh</Button>
          {loading && <span role="status" className="text-sm text-muted-foreground">Updating… Previous results remain visible.</span>}
          <span className="text-xs text-muted-foreground">Manual updates only.</span>
        </div>
        <p className="text-xs text-muted-foreground break-words">Applied: {applied.action === 'all' ? 'all actions' : applied.action}
          {applied.country ? ` · Country: ${applied.country}` : ''}
          {applied.excludedCountries.length ? ` · Excluding: ${applied.excludedCountries.join(', ')}` : ' · No country exclusions'}
          {applied.guestId ? ` · Guest: ${applied.guestId}` : ''}
          {applied.from ? ` · From: ${applied.from}` : ''}{applied.to ? ` · To: ${applied.to}` : ''}
        </p>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Guest Activity</h2>
          <p className="text-sm text-muted-foreground">
            Browsing activity from anonymous (not logged in) visitors, identified by a per-browser guest ID. Dates and times use Pakistan time (PKT, UTC+05:00).
          </p>
        </div>

        {/* Filters */}
        <fieldset disabled={loading} className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value) }}>
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
          <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Filter by country" placeholder="Filter by country..."
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value) }}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Exclude countries" title={excludedCountries.join(', ')} className="w-full sm:w-56 justify-between">
                <span className="truncate">{excludedCountries.length ? `Exclude: ${excludedCountries.join(', ')}` : 'Exclude countries: None'}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Exclude countries</DropdownMenuLabel>
              <DropdownMenuItem disabled={!excludedCountries.length} onSelect={() => { setExcludedCountries([]) }}>
                Clear all
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {[...new Set([...countries, ...excludedCountries])].sort((a, b) => a.localeCompare(b)).map((country) => (
                <DropdownMenuCheckboxItem
                  key={country}
                  checked={excludedCountries.includes(country)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) => {
                    setExcludedCountries((selected) => checked ? [...selected, country] : selected.filter((value) => value !== country))
                  }}
                >
                  {country}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            aria-label="Filter by guest ID" placeholder="Filter by guest ID..."
            value={guestIdFilter}
            onChange={(e) => { setGuestIdFilter(e.target.value) }}
            className="w-full sm:w-56"
          />
          <Input
            type="date" aria-label="Start date (Pakistan time)"
            value={from}
            onChange={(e) => { setFrom(e.target.value) }}
            className="w-full sm:w-40"
          />
          <Input
            type="date" aria-label="End date (Pakistan time)"
            value={to}
            onChange={(e) => { setTo(e.target.value) }}
            className="w-full sm:w-40"
          />
          <Button disabled={loading} onClick={() => void fetchActivity({ ...draft, page: 1 }, false, 'push', true)}>Apply filters</Button>
          {unapplied && <span className="self-center text-xs text-muted-foreground">Unapplied filter changes</span>}
        </fieldset>

        {error && (
          <div role="alert" className="rounded-lg border p-4 space-y-3">
            <p className="text-destructive">{error}</p>
            {activities.length > 0 && <p className="text-sm text-muted-foreground">Showing previous results.</p>}
            <Button disabled={loading} variant="outline" onClick={() => void fetchActivity(lastRequest.current.filters, lastRequest.current.options, lastRequest.current.history, lastRequest.current.updateDraft)}>Retry</Button>
          </div>
        )}
        {activities.length === 0 ? (
          <div className="text-center py-16 border-2 rounded-xl">
            <UsersIcon className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">{error ? 'Guest activity unavailable' : 'No guest activity found'}</h3>
            <p className="text-sm text-muted-foreground">Change filters and select Apply filters, or use Refresh.</p>
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
                  <TableHead>Device</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleString('en-US', { timeZone: ACTIVITY_REPORTING_TIMEZONE }) + ' PKT'}
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
                    <TableCell><ActivityDevice userAgent={activity.userAgent} /></TableCell>
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

        <GuestStatsDialog key={`${selectedGuestId}:${applied.from}:${applied.to}`} from={applied.from} to={applied.to} guestId={selectedGuestId} open={!!selectedGuestId} onOpenChange={(open) => !open && setSelectedGuestId(null)} />

        {total > 0 && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} events
              </p>
              <Select disabled={loading} value={String(draft.limit)} onValueChange={(value) => setLimit(Number(value))}>
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
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={loading || page <= 1} onClick={() => setPage(1)} title="First page">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={loading || page <= 1}
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
                    disabled={loading || pageNumber === page}
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
                disabled={loading || page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={loading || page >= pages} onClick={() => setPage(pages)} title="Last page">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
