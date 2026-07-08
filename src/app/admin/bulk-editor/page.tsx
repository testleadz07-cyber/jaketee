'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  LogOut,
  Loader2,
  AlertTriangle,
  Save,
  ChevronRight,
  TableProperties,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface BulkProduct {
  _id: string
  id?: string
  name: string
  price: number
  stockCount: number
  inStock: boolean
  isFeatured: boolean
  tags: string[]
  category?: { name: string }
  images: Array<{ url: string }>
}

interface DirtyRow {
  id: string
  price?: number
  stockCount?: number
  isFeatured?: boolean
}

const ITEMS_PER_PAGE = 20

function getMockProducts(): BulkProduct[] {
  return [
    { _id: 'mock-1', name: 'Luxe Slim Fit Chinos', price: 89.99, stockCount: 45, inStock: true, isFeatured: true, tags: ['New Arrival'], images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=80' }], category: { name: 'Bottoms' } },
    { _id: 'mock-2', name: 'Premium Oxford Shirt', price: 119.99, stockCount: 3, inStock: true, isFeatured: false, tags: ['Summer Sale'], images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=80' }], category: { name: 'Tops' } },
    { _id: 'mock-3', name: 'Merino Wool Sweater', price: 159.99, stockCount: 0, inStock: false, isFeatured: false, tags: [], images: [{ url: 'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=80' }], category: { name: 'Tops' } },
    { _id: 'mock-4', name: 'Technical Running Shorts', price: 69.99, stockCount: 22, inStock: true, isFeatured: true, tags: ['Best Seller'], images: [{ url: 'https://images.unsplash.com/photo-1520262454473-a1a82276a574?w=80' }], category: { name: 'Activewear' } },
    { _id: 'mock-5', name: 'Leather Derby Shoes', price: 249.99, stockCount: 1, inStock: true, isFeatured: false, tags: [], images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80' }], category: { name: 'Footwear' } },
    { _id: 'mock-6', name: 'Puffer Jacket Quilted', price: 299.99, stockCount: 8, inStock: true, isFeatured: false, tags: ['New Arrival'], images: [{ url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80' }], category: { name: 'Outerwear' } },
  ]
}

export default function BulkEditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<BulkProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dirtyRows, setDirtyRows] = useState<Record<string, DirtyRow>>({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchPage(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page])

  async function fetchPage(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bulk-edit?page=${p}&limit=${ITEMS_PER_PAGE}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setTotal(data.total)
      } else {
        setIsDemoMode(true)
        setProducts(getMockProducts())
        setTotal(6)
      }
    } catch {
      setIsDemoMode(true)
      setProducts(getMockProducts())
      setTotal(6)
    } finally {
      setLoading(false)
    }
  }

  const updateCell = useCallback((id: string, field: keyof DirtyRow, value: number | boolean) => {
    setDirtyRows(prev => ({ ...prev, [id]: { ...prev[id], id, [field]: value } }))
  }, [])

  function getCurrent<T>(product: BulkProduct, field: string, fallback: T): T {
    const id = product._id || product.id || ''
    const d = dirtyRows[id]
    if (!d) return fallback
    return ((d as unknown as Record<string, unknown>)[field] as T) ?? fallback
  }

  async function handleSave() {
    if (isDemoMode) {
      toast({ title: 'Demo Mode', description: 'Database not connected — changes cannot be saved.', variant: 'destructive' })
      return
    }
    const updates = Object.values(dirtyRows)
    if (updates.length === 0) { toast({ title: 'No Changes', description: 'Nothing to save.' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/bulk-edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates.map(u => ({ id: u.id, price: u.price, stock: u.stockCount, isFeatured: u.isFeatured })))
      })
      if (res.ok) {
        toast({ title: 'Changes Saved', description: `${updates.length} product(s) updated.` })
        setDirtyRows({})
        fetchPage(page)
      } else {
        toast({ title: 'Save Failed', description: 'Could not save changes.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
  const dirtyCount = Object.keys(dirtyRows).length

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product catalog...</p>
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
              <h1 className="text-2xl font-bold tracking-tight">LUXE STORE Admin</h1>
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
          <Link href="/admin/discounts"><Button variant="ghost" size="sm">Discounts</Button></Link>
          <Link href="/admin/bulk-editor"><Button variant="secondary" size="sm">Bulk Editor</Button></Link>
          <Link href="/admin/tags"><Button variant="ghost" size="sm">Tags</Button></Link>
          <Link href="/admin/refunds"><Button variant="ghost" size="sm">Refunds</Button></Link>
          <Link href="/admin/blog"><Button variant="ghost" size="sm">Blog</Button></Link>
        </div>
      </nav>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs"><strong>Database not connected.</strong> Showing demo data — changes cannot be saved.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TableProperties className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Bulk Product Editor</h2>
            </div>
            <p className="text-muted-foreground text-sm">Edit stock, pricing and visibility for all products at once. Changed rows are highlighted in yellow.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {dirtyCount > 0 && (
              <>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">{dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}</Badge>
                <Button variant="outline" size="sm" onClick={() => { setDirtyRows({}); toast({ title: 'Discarded' }) }} disabled={saving}>
                  <RotateCcw className="h-4 w-4 mr-1" />Discard
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving || dirtyCount === 0} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Grid */}
        <Card className="border-2 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Product Catalog — Page {page} of {totalPages}</CardTitle>
              <CardDescription className="text-xs">{total} total products</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-3 pl-4 min-w-[220px]">Product</th>
                    <th className="text-left p-3 min-w-[110px]">Category</th>
                    <th className="text-left p-3 min-w-[110px]">Price ($)</th>
                    <th className="text-left p-3 min-w-[120px]">Stock Count</th>
                    <th className="text-center p-3 min-w-[90px]">In Stock</th>
                    <th className="text-center p-3 min-w-[90px]">Featured</th>
                    <th className="text-left p-3 min-w-[120px]">Tags</th>
                    <th className="text-center p-3 min-w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => {
                    const id = product._id || product.id || ''
                    const isDirty = !!dirtyRows[id]
                    const currentPrice = getCurrent<number>(product, 'price', product.price)
                    const currentStock = getCurrent<number>(product, 'stockCount', product.stockCount)
                    const currentFeatured = getCurrent<boolean>(product, 'isFeatured', product.isFeatured)
                    const isLowStock = currentStock <= 5

                    return (
                      <tr key={id} className={`transition-colors ${isDirty ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'hover:bg-muted/20'}`}>
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                              <img src={product.images[0]?.url || ''} alt={product.name} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).src = '' }} />
                            </div>
                            <span className="font-medium truncate max-w-[160px]" title={product.name}>{product.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{product.category?.name || '—'}</td>
                        <td className="p-3">
                          <Input type="number" step="0.01" min="0" value={currentPrice}
                            onChange={(e) => updateCell(id, 'price', parseFloat(e.target.value) || 0)}
                            className="h-8 w-24 text-sm" disabled={isDemoMode} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Input type="number" min="0" value={currentStock}
                              onChange={(e) => updateCell(id, 'stockCount', parseInt(e.target.value) || 0)}
                              className={`h-8 w-20 text-sm ${isLowStock ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                              disabled={isDemoMode} />
                            {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => !isDemoMode && updateCell(id, 'stockCount', currentStock > 0 ? 0 : Math.max(product.stockCount, 10))}
                            disabled={isDemoMode}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${currentStock > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${currentStock > 0 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => !isDemoMode && updateCell(id, 'isFeatured', !currentFeatured)}
                            disabled={isDemoMode}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${currentFeatured ? 'bg-primary' : 'bg-muted-foreground/30'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${currentFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {product.tags?.length ? product.tags.slice(0, 2).map(t => (
                              <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                            )) : <span className="text-muted-foreground text-xs">—</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {isDirty
                            ? <span className="text-yellow-600 text-xs font-semibold">Modified</span>
                            : <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs font-medium">Page {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-yellow-400 border border-yellow-500" /><span>Unsaved changes</span></div>
          <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /><span>Low stock (5 or fewer units)</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span>No pending changes</span></div>
        </div>
      </main>
    </div>
  )
}
