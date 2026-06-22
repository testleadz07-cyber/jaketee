'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, LogOut, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

interface Category { id: string; name: string; slug: string }

export default function EditProduct() {
  const params = useParams()
  const productId = params.id as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      Promise.all([
        fetch(`/api/products/${productId}`).then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([prod, cats]) => {
        setProduct(prod)
        setCategories(cats)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [status, router, productId])

  const handleSave = async () => {
    if (!product) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      if (res.ok) {
        router.push('/admin/products')
      } else {
        alert('Failed to save product')
      }
    } catch {
      alert('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) return null

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/admin/products"><Button>Back to Products</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/products"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <h1 className="text-2xl font-bold">Edit Product</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{session.user?.email}</span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" step="0.01" value={product.price} onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare At Price ($)</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" value={product.compareAtPrice || ''} onChange={(e) => setProduct({ ...product, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockCount">Stock Count</Label>
                  <Input id="stockCount" type="number" value={product.stockCount || ''} onChange={(e) => setProduct({ ...product, stockCount: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={product.categoryId?.toString() || product.category?._id} onValueChange={(value) => setProduct({ ...product, categoryId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <ImageUpload
                  initialImage={product.images?.[0]?.url || ''}
                  onUpload={(url) => setProduct({ ...product, images: [{ url, alt: product.name, order: 0 }] })}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Checkbox id="featured" checked={product.isFeatured} onCheckedChange={(checked) => setProduct({ ...product, isFeatured: checked as boolean })} />
                <Label htmlFor="featured" className="cursor-pointer">Featured Product</Label>
              </div>
              <div className="flex items-center space-x-4">
                <Checkbox id="inStock" checked={product.inStock} onCheckedChange={(checked) => setProduct({ ...product, inStock: checked as boolean })} />
                <Label htmlFor="inStock" className="cursor-pointer">In Stock</Label>
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/admin/products" className="flex-1"><Button variant="outline" className="w-full">Cancel</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}