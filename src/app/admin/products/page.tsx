'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
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
  Inbox
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  _id?: string
  name: string
  slug: string
  price: number
  inStock: boolean
  isFeatured: boolean
  category?: {
    name: string
    slug: string
  }
  images: Array<{ url: string }>
}

export default function AdminProducts() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts()
    }
  }, [status])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?all=true')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
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
  }

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

  const handleDeleteSingle = async (product: Product) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Deleting products is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return
    }

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

  const handleBulkDelete = async () => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Bulk deleting products is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    if (selectedIds.length === 0) return

    if (!confirm(`Are you sure you want to delete all ${selectedIds.length} selected products?`)) {
      return
    }

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
      } else {
        const err = await res.json()
        toast({
          title: 'Bulk Deletion Failed',
          description: err.error || 'Failed to delete products.',
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
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
              <h1 className="text-2xl font-bold tracking-tight">LUXE STORE Admin</h1>
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
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
              <CardTitle className="text-lg">Product Catalog ({filteredProducts.length})</CardTitle>
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
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {product.isFeatured && (
                              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-[10px] text-primary">Featured</Badge>
                            )}
                            <Badge variant={product.inStock ? 'default' : 'destructive'} className="text-[10px]">
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
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
    </div>
  )
}