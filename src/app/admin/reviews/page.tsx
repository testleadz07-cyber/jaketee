'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  Star,
  Check,
  X,
  Trash2,
  MessageSquare,
  ImageIcon,
  VideoIcon,
  Search,
} from 'lucide-react'
import Link from 'next/link'

interface AdminReview {
  id: string
  productId: string
  userName: string
  rating: number
  title?: string
  comment: string
  isVerified: boolean
  images?: string[]
  videos?: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    image: string | null
  } | null
}

const STATUS_TABS: Array<{ key: 'all' | 'pending' | 'approved' | 'rejected'; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

export default function AdminReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

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

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (activeTab !== 'all') params.set('status', activeTab)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/admin/reviews?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
        setTotal(Number(res.headers.get('X-Total-Count') || data.length))
        setPages(Number(res.headers.get('X-Pages') || 1))
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, searchQuery])

  useEffect(() => {
    if (status === 'authenticated') fetchReviews()
  }, [status, fetchReviews])

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast({
          title: newStatus === 'approved' ? 'Review approved' : 'Review rejected',
          description: 'Product rating stats have been recalculated.',
        })
        setReviews((prev) =>
          activeTab === 'all'
            ? prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
            : prev.filter((r) => r.id !== id)
        )
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update review', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to communicate with server.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this review? This cannot be undone.')) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Review deleted' })
        setReviews((prev) => prev.filter((r) => r.id !== id))
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete review', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to communicate with server.', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadgeClass = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'approved':
        return 'bg-emerald-100 text-emerald-800'
      case 'rejected':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (status === 'loading' || (loading && reviews.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reviews...</p>
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
            <Button variant="ghost" size="sm">Dashboard</Button>
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
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">Users</Button>
          </Link>
          <Link href="/admin/guest-activity">
            <Button variant="ghost" size="sm">Guest Activity</Button>
          </Link>
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm">Notifications</Button>
          </Link>
          <Link href="/admin/subscribers"><Button variant="ghost" size="sm">Subscribers</Button></Link>
          <Link href="/admin/contact-messages"><Button variant="ghost" size="sm">Contact Messages</Button></Link>
          <Link href="/admin/reviews">
            <Button variant="secondary" size="sm">Reviews</Button>
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
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">Blog</Button>
          </Link>
        </div>
      </nav>

      {/* Main Body */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Review Moderation</h2>
          <p className="text-sm text-muted-foreground">Approve, reject, or delete customer reviews before they go live on product pages.</p>
        </div>

        {/* Search & Status Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, comment, or reviewer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <Card className="border-2 shadow-sm">
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">No reviews found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                There are no reviews in this category right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-2 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        {review.product ? review.product.name : 'Unknown Product'}
                      </CardTitle>
                      <Badge className={`text-[10px] font-bold ${getStatusBadgeClass(review.status)}`}>
                        {review.status.toUpperCase()}
                      </Badge>
                      {review.isVerified && (
                        <Badge variant="outline" className="text-[10px]">Verified Purchase</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span>{review.userName}</span>
                      <span>&middot;</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.product && (
                    <Link href={`/products/${review.product.slug}`} target="_blank">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                        {review.product.image ? (
                          <Image src={review.product.image} alt={review.product.name} fill sizes="56px" className="object-cover" />
                        ) : null}
                      </div>
                    </Link>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    {review.title && <p className="font-bold text-sm">{review.title}</p>}
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>

                  {((review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                    <div className="flex flex-wrap gap-3">
                      {review.images?.map((url, idx) => (
                        <a
                          key={`img-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted border block"
                        >
                          <Image src={url} alt={`Review media ${idx + 1}`} fill sizes="80px" className="object-cover" />
                          <div className="absolute top-1 left-1 bg-black/60 rounded-full p-0.5">
                            <ImageIcon className="h-3 w-3 text-white" />
                          </div>
                        </a>
                      ))}
                      {review.videos?.map((url, idx) => (
                        <a
                          key={`vid-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted border flex items-center justify-center"
                        >
                          <video src={url} className="object-cover w-full h-full" muted />
                          <div className="absolute top-1 left-1 bg-black/60 rounded-full p-0.5">
                            <VideoIcon className="h-3 w-3 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    {review.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={updatingId === review.id}
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Approve
                      </Button>
                    )}
                    {review.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === review.id}
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={updatingId === review.id}
                      onClick={() => handleDelete(review.id)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {page} of {pages} ({total} reviews)</p>
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
