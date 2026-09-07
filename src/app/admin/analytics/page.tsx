'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ChevronLeft, LogOut, Users, Clock, Activity, Globe, Zap, TrendingUp, Monitor, Smartphone, RefreshCw } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function parseDevice(ua: string | null): { type: 'mobile' | 'desktop'; label: string } {
  if (!ua) return { type: 'desktop', label: 'Unknown' }
  const lower = ua.toLowerCase()
  if (/iphone|ipad|android|mobile/.test(lower)) return { type: 'mobile', label: 'Mobile' }
  return { type: 'desktop', label: 'Desktop' }
}

function formatActionLabel(action: string): string {
  const map: Record<string, string> = {
    login: 'Login',
    view_product: 'View Product',
    view_category: 'View Category',
    add_to_cart: 'Add to Cart',
    search: 'Search',
    place_order: 'Place Order',
    logout: 'Logout',
    register: 'Register',
  }
  return map[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const ACTION_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

// ── Mini SVG Bar Chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data in last 30 days.</p>
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  const W = 800
  const H = 120
  const barW = Math.max(4, Math.floor((W - data.length * 2) / data.length))
  const gap = Math.floor((W - data.length * barW) / (data.length + 1))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full min-w-[400px]" style={{ height: 144 }}>
        {data.map((d, i) => {
          const barH = Math.max(3, Math.round((d.count / max) * H))
          const x = gap + i * (barW + gap)
          const y = H - barH
          const isLast5 = i >= data.length - 5
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={barW > 6 ? 3 : 1}
                fill={isLast5 ? '#6366f1' : '#a5b4fc'}
                opacity={0.9}
              />
              {d.count > 0 && barH > 14 && (
                <text
                  x={x + barW / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill="currentColor"
                  className="fill-muted-foreground"
                >
                  {d.count}
                </text>
              )}
              {data.length <= 14 && (
                <text
                  x={x + barW / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize={7}
                  fill="currentColor"
                  className="fill-muted-foreground"
                >
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Donut-like Action Breakdown ───────────────────────────────────────────────

function ActionBreakdown({ data }: { data: { action: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No activity data.</p>
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
        return (
          <div key={d.action} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: ACTION_COLORS[i % ACTION_COLORS.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium truncate">{formatActionLabel(d.action)}</span>
                <span className="text-muted-foreground ml-2 flex-shrink-0">{d.count.toLocaleString()} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: ACTION_COLORS[i % ACTION_COLORS.length],
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Admin Navigation ──────────────────────────────────────────────────────────

function AdminNav({ email }: { email: string }) {
  const router = useRouter()
  return (
    <>
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/"><Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button></Link>
              <h1 className="text-2xl font-bold tracking-tight">Jacketee Admin</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logged in as <span className="font-semibold text-foreground">{email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-background border-b py-2 sticky top-[73px] z-10">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto">
          <Link href="/admin/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          <Link href="/admin/products"><Button variant="ghost" size="sm">Products</Button></Link>
          <Link href="/admin/categories"><Button variant="ghost" size="sm">Categories</Button></Link>
          <Link href="/admin/orders"><Button variant="ghost" size="sm">Orders</Button></Link>
          <Link href="/admin/users"><Button variant="ghost" size="sm">Users</Button></Link>
          <Link href="/admin/guest-activity"><Button variant="ghost" size="sm">Guest Activity</Button></Link>
          <Link href="/admin/notifications"><Button variant="ghost" size="sm">Notifications</Button></Link>
          <Link href="/admin/subscribers"><Button variant="ghost" size="sm">Subscribers</Button></Link>
          <Link href="/admin/contact-messages"><Button variant="ghost" size="sm">Contact Messages</Button></Link>
          <Link href="/admin/analytics"><Button variant="secondary" size="sm">Analytics</Button></Link>
          <Link href="/admin/reviews"><Button variant="ghost" size="sm">Reviews</Button></Link>
          <Link href="/admin/discounts"><Button variant="ghost" size="sm">Discounts</Button></Link>
          <Link href="/admin/bulk-editor"><Button variant="ghost" size="sm">Bulk Editor</Button></Link>
          <Link href="/admin/tags"><Button variant="ghost" size="sm">Tags</Button></Link>
          <Link href="/admin/refunds"><Button variant="ghost" size="sm">Refunds</Button></Link>
          <Link href="/admin/blog"><Button variant="ghost" size="sm">Blog</Button></Link>
        </div>
      </nav>
    </>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <Card className="border-2 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: `radial-gradient(circle at 80% 50%, ${color}, transparent 70%)` }}
      />
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: {
    totalSessions: number
    totalUsers: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    activeNow: number
    avgDurationSeconds: number
    totalTimeSeconds: number
  }
  sessionsPerDay: { date: string; count: number }[]
  topUsers: {
    userId: string
    name: string
    email: string
    sessionCount: number
    totalTimeSeconds: number
    lastLogin: string
  }[]
  recentSessions: {
    id: string
    userId: string
    userName: string
    userEmail: string
    loginAt: string
    logoutAt: string | null
    lastSeenAt: string
    durationSeconds: number | null
    ip: string | null
    country: string
    userAgent: string | null
    isActive: boolean
  }[]
  actionBreakdown: { action: string; count: number }[]
  topCountries: { country: string; count: number }[]
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Analytics fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  }, [status, fetchData])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold">Access Denied. Admins Only.</p>
          <Link href="/"><Button className="mt-4">Back to Storefront</Button></Link>
        </div>
      </div>
    )
  }

  const email = session.user?.email || ''
  const kpis = data?.kpis

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <AdminNav email={email} />

      <main className="container mx-auto px-4 py-8 flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> User Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Login sessions, engagement metrics, and activity breakdown.
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {loading && !data ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="text-muted-foreground text-center py-20">Failed to load analytics.</p>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <KpiCard
                icon={Users}
                label="Total Users"
                value={kpis!.totalUsers.toLocaleString()}
                sub={`+${kpis!.newUsersThisWeek} this week`}
                color="#6366f1"
              />
              <KpiCard
                icon={Activity}
                label="Total Sessions"
                value={kpis!.totalSessions.toLocaleString()}
                sub="All time"
                color="#8b5cf6"
              />
              <KpiCard
                icon={Zap}
                label="Active Now"
                value={String(kpis!.activeNow)}
                sub="Within last 5 min"
                color="#10b981"
              />
              <KpiCard
                icon={Clock}
                label="Avg Session"
                value={formatDuration(kpis!.avgDurationSeconds)}
                sub="Completed sessions"
                color="#f59e0b"
              />
              <KpiCard
                icon={TrendingUp}
                label="New This Month"
                value={kpis!.newUsersThisMonth.toLocaleString()}
                sub="Registered users"
                color="#ec4899"
              />
              <KpiCard
                icon={Clock}
                label="Total Time"
                value={formatDuration(kpis!.totalTimeSeconds)}
                sub="All users combined"
                color="#3b82f6"
              />
              {data.topCountries[0] && (
                <KpiCard
                  icon={Globe}
                  label="Top Country"
                  value={data.topCountries[0].country}
                  sub={`${data.topCountries[0].count} sessions`}
                  color="#14b8a6"
                />
              )}
            </div>

            {/* Sessions Per Day Chart */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" /> Sessions Per Day (Last 30 Days)
                </CardTitle>
                <CardDescription>
                  Daily login session volume. Darker bars = most recent 5 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart data={data.sessionsPerDay} />
              </CardContent>
            </Card>

            {/* Three column section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Action Breakdown */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" /> Action Breakdown
                  </CardTitle>
                  <CardDescription>Top activity types (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActionBreakdown data={data.actionBreakdown} />
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" /> Top Countries
                  </CardTitle>
                  <CardDescription>Where your users log in from</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.topCountries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No geo data yet. Appears after heartbeats resolve country.</p>
                  ) : (
                    data.topCountries.map((c, i) => (
                      <div key={c.country} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                        <span className="flex-1 text-sm font-medium">{c.country}</span>
                        <Badge variant="secondary">{c.count}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" /> Most Active Users
                  </CardTitle>
                  <CardDescription>By session count (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.topUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                  ) : (
                    data.topUsers.slice(0, 5).map((u, i) => (
                      <Link key={u.userId} href={`/admin/users/${u.userId}`}>
                        <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                          <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold">{u.sessionCount} sessions</p>
                            <p className="text-xs text-muted-foreground">{formatDuration(u.totalTimeSeconds)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Sessions Feed */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Recent Sessions
                </CardTitle>
                <CardDescription>Last 20 login sessions across all users</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {data.recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-6 py-6">No sessions recorded yet. Login events will appear here.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">User</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">Login</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">Duration</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">Status</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">Device</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">Country</th>
                        <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSessions.map((s, i) => {
                        const device = parseDevice(s.userAgent)
                        return (
                          <tr
                            key={s.id}
                            className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                          >
                            <td className="px-4 py-2.5">
                              <Link href={`/admin/users/${s.userId}`} className="hover:underline">
                                <p className="font-medium">{s.userName}</p>
                                <p className="text-xs text-muted-foreground">{s.userEmail}</p>
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(s.loginAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                              {formatDuration(s.durationSeconds)}
                            </td>
                            <td className="px-4 py-2.5">
                              {s.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">Active</Badge>
                              ) : s.logoutAt ? (
                                <Badge variant="outline" className="text-xs">Ended</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Idle</Badge>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {device.type === 'mobile' ? (
                                <span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile</span>
                              ) : (
                                <span className="inline-flex items-center gap-1"><Monitor className="h-3 w-3" /> Desktop</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{s.country}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">{s.ip || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
