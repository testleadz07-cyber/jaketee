'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AdminLoadingShell } from '@/components/admin/admin-loading-shell'
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
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  LogOut,
  Loader2,
  AlertTriangle,
  Package,
  Layers,
  Inbox,
  ExternalLink,
  Star,
  Boxes,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { buildProductUrl } from '@/lib/categories'

interface Product {
  id: string
  _id?: string
  name: string
  slug: string
  price: number
  inStock: boolean
  isFeatured: boolean
  stockCount?: number
  averageRating?: number
  reviewCount?: number
  tags?: string[]
  category?: {
    name: string
    slug: string
  }
  categoryPath?: Array<{ name: string; slug: string }>
  images: Array<{ url: string }>
  createdAt?: string
}

export default function AdminProducts() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Debounce free-text search before it hits the server.
    const t = setTimeout(() => {
      setPage(1)
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [categoryFilter])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('all', 'true')
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
        setTotal(Number(res.headers.get('X-Total-Count') || data.length))
        setPages(Number(res.headers.get('X-Pages') || 1))
        // Detect fallback mock data
        const first = data[0]
        if (first && first._id && !first.id) {
          setIsDemoMode(true)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, categoryFilter])

  useEffect(() => {
    if (status === 'authenticated') fetchProducts()
  }, [status, fetchProducts])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []))
        .catch(() => setCategories([]))
    }
  }, [status])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredProducts.map(p => p.id || p._id || '')
      setSelectedIds(allIds.filter(id => id !== ''))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleDeleteSingle = (product: Product) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Deleting products is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }
    setDeleteTarget(product)
  }

  const executeDeleteSingle = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id || product._id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Product Deleted',
          description: 'The product was successfully deleted.'
        })
        fetchProducts()
        setDeleteTarget(null)
      } else {
        const err = await res.json()
        toast({
          title: 'Error Deleting Product',
          description: err.error || 'Failed to delete product.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      })
    }
  }

  const handleBulkDelete = () => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Bulk deleting products is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    if (selectedIds.length === 0) return
    setIsBulkDeleteOpen(true)
  }

  const executeBulkDelete = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })

      if (res.ok) {
        toast({
          title: 'Bulk Deletion Complete',
          description: `Successfully deleted ${selectedIds.length} products.`
        })
        setSelectedIds([])
        fetchProducts()
        setIsBulkDeleteOpen(false)
      } else {
        const err = await res.json()
        toast({
          title: 'Bulk Deletion Failed',
          description: err.error || 'Failed to bulk delete products.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products

  if (status === 'loading' || loading) {
    return <AdminLoadingShell label="Loading products..." />
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

  const allFilteredSelected = filteredProducts.length > 0 && 
    filteredProducts.every(p => selectedIds.includes(p.id || p._id || ''))

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col pb-24">
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
            <Button variant="secondary" size="sm">Products</Button>
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
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">Blog</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs">
              <strong>Database not connected.</strong> Using read-only static product data. CRUD operations are disabled.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Products</h2>
            <p className="text-muted-foreground text-sm">Manage, edit, or delete items in the store</p>
          </div>
          <Link href="/admin/products/new">
            <Button disabled={isDemoMode} className="gap-1">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>

        {/* Search & Bulk Action Summary */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <span className="font-semibold">{selectedIds.length}</span> items selected
              <Button variant="link" size="sm" onClick={() => setSelectedIds([])} className="text-muted-foreground h-auto p-0 ml-2">
                Clear selection
              </Button>
            </div>
          )}
        </div>

        {/* Products Table Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
              <CardTitle className="text-lg">Product Catalog ({total})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const prodId = product.id || product._id || ''
                  const isChecked = selectedIds.includes(prodId)

                  return (
                    <div
                      key={prodId}
                      className={`flex items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => handleSelectOne(prodId, !!checked)}
                          aria-label={`Select ${product.name}`}
                        />
                      </div>
                      
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                          <img
                            src={product.images[0]?.url || '/placeholder.png'}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{product.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="font-semibold text-primary">${product.price.toFixed(2)}</span>
                            <span>•</span>
                            <span>{product.category?.name || 'Uncategorized'}</span>
                            <span>•</span>
                            <span className="font-mono truncate max-w-[180px]" title={product.slug}>{product.slug}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {product.isFeatured && (
                              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-[10px] text-primary">Featured</Badge>
                            )}
                            <Badge variant={product.inStock ? 'default' : 'destructive'} className="text-[10px]">
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                            {product.stockCount !== undefined && product.stockCount <= 5 && (
                              <Badge className="text-[10px] bg-red-600 hover:bg-red-600 text-white border-red-700 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock ({product.stockCount})
                              </Badge>
                            )}
                          </div>

                        </div>
                      </div>

                      <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1.5 w-20" title="Stock count">
                          <Boxes className="h-3.5 w-3.5" />
                          {product.stockCount ?? '—'}
                        </div>
                        <div className="flex items-center gap-1.5 w-24" title="Rating">
                          <Star className="h-3.5 w-3.5" />
                          {product.averageRating ? product.averageRating.toFixed(1) : '—'}
                          {product.reviewCount !== undefined && (
                            <span>({product.reviewCount})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 w-24" title="Date added">
                          <Calendar className="h-3.5 w-3.5" />
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={buildProductUrl(product)} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0" title="View Product">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${prodId}`}>
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0" title="Edit Product">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteSingle(product)}
                          disabled={isDemoMode}
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-55" />
                  <p className="font-medium">No products match your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {page} of {pages} ({total} products)</p>
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border-2 shadow-2xl p-4 rounded-2xl flex items-center gap-6 max-w-lg w-[90%] justify-between animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="text-sm font-medium">
            <span className="font-bold text-primary">{selectedIds.length}</span> products selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={handleBulkDelete}
              disabled={isSubmitting || isDemoMode}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              {" "}<span className="font-semibold text-foreground">"{deleteTarget?.name}"</span> and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  executeDeleteSingle(deleteTarget)
                  setDeleteTarget(null)
                }
              }}
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Alert Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-semibold text-foreground">{selectedIds.length} selected products</span> and remove all of their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                executeBulkDelete()
                setIsBulkDeleteOpen(false)
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}