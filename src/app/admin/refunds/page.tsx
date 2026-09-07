'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Inbox,
  Clock,
  Search
} from 'lucide-react'
import Link from 'next/link'

interface RefundRequest {
  _id: string
  orderId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  userName?: string
  userEmail?: string
}

const MOCK_REQUESTS: RefundRequest[] = [
  { _id: 'mock-1', orderId: 'LX-2024-001', reason: 'Item arrived damaged. The package was torn and the shirt had a large stain.', status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), userName: 'John Smith', userEmail: 'john@example.com' },
  { _id: 'mock-2', orderId: 'LX-2024-002', reason: 'Wrong size was shipped. I ordered a Large but received a Medium.', status: 'pending', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString(), userName: 'Emma Davis', userEmail: 'emma@example.com' },
  { _id: 'mock-3', orderId: 'LX-2024-003', reason: 'Changed my mind about the color.', status: 'approved', createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date(Date.now() - 259200000).toISOString(), userName: 'Michael Lee', userEmail: 'michael@example.com' },
  { _id: 'mock-4', orderId: 'LX-2024-004', reason: 'Item worn and returned — violates return policy.', status: 'rejected', createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date(Date.now() - 518400000).toISOString(), userName: 'Sara Wilson', userEmail: 'sara@example.com' },
]

export default function AdminRefundsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
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

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (activeTab !== 'all') params.set('status', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/admin/refunds?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setTotal(data.total ?? (data.requests || []).length)
        setPages(data.pages || 1)
      } else {
        setIsDemoMode(true)
        setRequests(MOCK_REQUESTS)
      }
    } catch {
      setIsDemoMode(true)
      setRequests(MOCK_REQUESTS)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, searchQuery])

  useEffect(() => {
    if (status === 'authenticated') fetchRequests()
  }, [status, fetchRequests])

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    if (isDemoMode) {
      toast({ title: 'Demo Mode', description: 'Database not connected — actions disabled.', variant: 'destructive' })
      return
    }
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action })
      })
      if (res.ok) {
        toast({ title: action === 'approved' ? 'Request Approved' : 'Request Rejected', description: `Refund request has been ${action}.` })
        fetchRequests()
      } else {
        toast({ title: 'Error', description: 'Failed to update request.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = requests
  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  function getStatusBadge(s: string) {
    switch (s) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected': return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default: return <Badge variant="outline">{s}</Badge>
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading refund requests...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-semibold">Access Denied. Admins Only.</p>
          <Link href="/"><Button className="mt-4">Back to Storefront</Button></Link>
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
              <Link href="/"><Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button></Link>
              <h1 className="text-2xl font-bold tracking-tight">Jacketee Admin</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logged in as <span className="font-semibold text-foreground">{session.user?.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />Logout
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
          <Link href="/admin/guest-activity"><Button variant="ghost" size="sm">Guest Activity</Button></Link>
          <Link href="/admin/notifications"><Button variant="ghost" size="sm">Notifications</Button></Link>
          <Link href="/admin/subscribers"><Button variant="ghost" size="sm">Subscribers</Button></Link>
          <Link href="/admin/contact-messages"><Button variant="ghost" size="sm">Contact Messages</Button></Link>
          <Link href="/admin/discounts"><Button variant="ghost" size="sm">Discounts</Button></Link>
          <Link href="/admin/bulk-editor"><Button variant="ghost" size="sm">Bulk Editor</Button></Link>
          <Link href="/admin/tags"><Button variant="ghost" size="sm">Tags</Button></Link>
          <Link href="/admin/refunds"><Button variant="secondary" size="sm">Refunds</Button></Link>
          <Link href="/admin/blog"><Button variant="ghost" size="sm">Blog</Button></Link>
        </div>
      </nav>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs"><strong>Database not connected.</strong> Showing demo refund requests. Approve/Reject actions are disabled.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Refund &amp; Return Requests</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Review and action customer refund/return requests submitted via the public form.{' '}
              <Link href="/returns#request-form" className="text-primary hover:underline text-xs" target="_blank">
                View public form →
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold">
              {total} {activeTab === 'all' ? 'total' : activeTab}
            </Badge>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex border-b overflow-x-auto gap-2 py-1 select-none">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize border-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map((req) => (
            <Card key={req._id} className="border-2 overflow-hidden bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base">Order #{req.orderId}</span>
                      {getStatusBadge(req.status)}
                    </div>

                    {(req.userName || req.userEmail) && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{req.userName}</span>
                        {req.userEmail && ` (${req.userEmail})`}
                      </p>
                    )}

                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{req.reason}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(req.createdAt).toLocaleDateString()} at{' '}
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:min-w-[140px]">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        onClick={() => handleAction(req._id, 'approved')}
                        disabled={updatingId === req._id}
                      >
                        {updatingId === req._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/5 gap-1.5"
                        onClick={() => handleAction(req._id, 'rejected')}
                        disabled={updatingId === req._id}
                      >
                        {updatingId === req._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Reject
                      </Button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                    <div className="text-xs text-muted-foreground md:text-right">
                      <p>Updated {new Date(req.updatedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="py-20 text-center border rounded-xl bg-card border-dashed">
              <Inbox className="h-12 w-12 text-muted-foreground opacity-65 mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">No {activeTab !== 'all' ? activeTab : ''} requests found</p>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {page} of {pages} ({total} requests)</p>
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
      </main>
    </div>
  )
}
