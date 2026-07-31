'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  Inbox,
  Search,
  Trash2,
  Mail,
  MailOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ContactMessageRow {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function AdminContactMessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [messages, setMessages] = useState<ContactMessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/contact-messages?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setPages(data.pages || 1)
        setTotal(data.total || 0)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    if (status === 'authenticated') fetchMessages()
  }, [status, fetchMessages])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  const toggleExpand = async (msg: ContactMessageRow) => {
    const opening = expandedId !== msg.id
    setExpandedId(opening ? msg.id : null)
    if (opening && !msg.read) {
      try {
        await fetch('/api/admin/contact-messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: msg.id, read: true }),
        })
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // non-critical
      }
    }
  }

  const toggleRead = async (msg: ContactMessageRow, read: boolean) => {
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id, read }),
      })
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read } : m)))
        setUnreadCount((c) => Math.max(0, c + (read ? -1 : 1)))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update message.', variant: 'destructive' })
    }
  }

  const handleDelete = async (msg: ContactMessageRow) => {
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${msg.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Message deleted' })
        fetchMessages()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to delete message.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }

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
              <h1 className="text-2xl font-bold tracking-tight">LUXE STORE Admin</h1>
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
          <Link href="/admin/guest-activity"><Button variant="ghost" size="sm">Guest Activity</Button></Link>
          <Link href="/admin/notifications"><Button variant="ghost" size="sm">Notifications</Button></Link>
          <Link href="/admin/subscribers"><Button variant="ghost" size="sm">Subscribers</Button></Link>
          <Link href="/admin/contact-messages"><Button variant="secondary" size="sm">Contact Messages</Button></Link>
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
          <h2 className="text-xl font-bold tracking-tight">Contact Messages</h2>
          <p className="text-sm text-muted-foreground">
            Submissions from the site's Contact Us form ({total} total, {unreadCount} unread).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, subject, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 border-2 rounded-xl">
            <Inbox className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">No messages found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="border-2 rounded-xl overflow-hidden bg-background divide-y">
            {messages.map((msg) => {
              const isExpanded = expandedId === msg.id
              return (
                <div key={msg.id} className={!msg.read ? 'bg-primary/5' : undefined}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(msg)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!msg.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        <p className={`text-sm sm:text-base truncate ${!msg.read ? 'font-semibold' : 'font-medium'}`}>
                          {msg.subject}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {msg.name} &lt;{msg.email}&gt; &bull; {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{msg.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${msg.email}`}>Reply via Email</a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => toggleRead(msg, !msg.read)}
                        >
                          {msg.read ? (
                            <>
                              <Mail className="h-4 w-4" /> Mark as Unread
                            </>
                          ) : (
                            <>
                              <MailOpen className="h-4 w-4" /> Mark as Read
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(msg)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages} ({total} messages)
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              The message from{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
