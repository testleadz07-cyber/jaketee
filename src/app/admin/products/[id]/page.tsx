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
import { orderCategoriesForDisplay } from '@/lib/categories'

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

interface VariantInput {
  name: string
  value: string
  priceAdjust: number
  inStock: boolean
  image?: string
}

const VARIANT_SUGGESTIONS: Record<string, Array<{ name: string; label: string; values: string[] }>> = {
  'tops': [
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'White', 'Navy', 'Gray'] }
  ],
  'bottoms': [
    { name: 'Size', label: 'Waist Sizes', values: ['30', '32', '34', '36'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Navy', 'Khaki'] }
  ],
  'footwear': [
    { name: 'Size', label: 'Sizes', values: ['US 8', 'US 9', 'US 10', 'US 11'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'White', 'Gray'] }
  ],
  'activewear': [
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Navy', 'Red', 'Blue'] }
  ],
  'outerwear': [
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Navy', 'Gray', 'Olive'] }
  ],
  'accessories': [
    { name: 'Material', label: 'Materials', values: ['Leather', 'Canvas', 'Nylon'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Brown', 'Tan'] }
  ]
}

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

  // Depth-first, indented ordering so the category dropdown reads as a tree
  // instead of a flat, ambiguous list once subcategories exist.
  const orderedCategories = orderCategoriesForDisplay(
    categories.map((c) => ({ ...c, _id: c.id }))
  )

  const handleSave = async () => {
    if (!product) return
    setSaving(true)

    // Clean variants payload before saving
    const cleanedVariants = (variants || []).map(v => ({
      name: v.name.trim(),
      value: v.value.trim(),
      priceAdjust: v.priceAdjust,
      inStock: v.inStock,
      image: v.image && v.image !== 'no_image' ? v.image : null
    }))

    const payload = {
      ...product,
      variants: cleanedVariants
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const variants = product.variants || []
  const setVariants = (updatedVariants: VariantInput[]) => {
    setProduct({ ...product, variants: updatedVariants })
  }

  const activeCategoryId = product.categoryId?.toString() || product.category?._id

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
                <Input id="name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} disabled={saving} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" step="0.01" value={product.price} onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })} disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare At Price ($)</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" value={product.compareAtPrice || ''} onChange={(e) => setProduct({ ...product, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })} disabled={saving} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockCount">Stock Count</Label>
                  <Input id="stockCount" type="number" value={product.stockCount || ''} onChange={(e) => setProduct({ ...product, stockCount: parseInt(e.target.value) || 0 })} disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={activeCategoryId}
                    onValueChange={(value) => {
                      // Auto-populate default variations on category change if no variants exist
                      const selectedCat = categories.find(c => c.id === value)
                      const slug = selectedCat?.slug?.toLowerCase() || ''
                      const suggestions = VARIANT_SUGGESTIONS[slug] || []
                      
                      let newVariants = product.variants || []
                      if (newVariants.length === 0 && suggestions.length > 0) {
                        const defaults: VariantInput[] = []
                        suggestions.forEach(sug => {
                          sug.values.forEach(val => {
                            defaults.push({
                              name: sug.name,
                              value: val,
                              priceAdjust: 0,
                              inStock: true
                            })
                          })
                        })
                        newVariants = defaults
                      }
                      
                      setProduct({
                        ...product,
                        categoryId: value,
                        variants: newVariants
                      })
                    }}
                    disabled={saving}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {orderedCategories.map(({ category: cat, depth }) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {depth > 0 ? '  '.repeat(depth) + '↳ ' : ''}{cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category-linked Variations Selection */}
              {activeCategoryId && (() => {
                const selectedCat = categories.find(c => c.id === activeCategoryId)
                const slug = selectedCat?.slug?.toLowerCase() || ''
                const suggestions = VARIANT_SUGGESTIONS[slug] || []

                return (
                  <div className="space-y-3 p-4 bg-muted/30 border rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Product Variations</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVariants([...variants, { name: '', value: '', priceAdjust: 0, inStock: true }])}
                        disabled={saving}
                      >
                        + Add Custom Variant
                      </Button>
                    </div>

                    {suggestions.length > 0 && (
                      <div className="space-y-1.5 border-b pb-3">
                        <p className="text-xs text-muted-foreground font-medium">Quick Suggestions for "{selectedCat?.name}":</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((sug, idx) => (
                            <Button
                              key={idx}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-background border hover:bg-muted"
                              onClick={() => {
                                const newRows = sug.values.map(val => ({
                                  name: sug.name,
                                  value: val,
                                  priceAdjust: 0,
                                  inStock: true
                                }))
                                setVariants([...variants, ...newRows])
                              }}
                              disabled={saving}
                            >
                              + Add {sug.label} ({sug.values.join(', ')})
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {variants.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No variations configured. This is a standard simple product.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {variants.map((v: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 bg-background p-2.5 rounded-lg border text-sm">
                            <div className="flex-1 min-w-0">
                              <Input
                                placeholder="Option (e.g. Size)"
                                value={v.name}
                                onChange={(e) => {
                                  const updated = [...variants]
                                  updated[index].name = e.target.value
                                  setVariants(updated)
                                }}
                                className="h-8 text-xs font-medium"
                                required
                                disabled={saving}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input
                                placeholder="Value (e.g. XL)"
                                value={v.value}
                                onChange={(e) => {
                                  const updated = [...variants]
                                  updated[index].value = e.target.value
                                  setVariants(updated)
                                }}
                                className="h-8 text-xs"
                                required
                                disabled={saving}
                              />
                            </div>
                             <div className="w-24">
                               <Input
                                 type="number"
                                 step="0.01"
                                 placeholder="Price +/-"
                                 value={v.priceAdjust || ''}
                                 onChange={(e) => {
                                   const updated = [...variants]
                                   updated[index].priceAdjust = parseFloat(e.target.value) || 0
                                   setVariants(updated)
                                 }}
                                 className="h-8 text-xs"
                                 disabled={saving}
                               />
                             </div>
                             <div className="w-28 flex-shrink-0">
                               <Select
                                 value={v.image || 'no_image'}
                                 onValueChange={(url) => {
                                   const updated = [...variants]
                                   updated[index].image = url === 'no_image' ? '' : url
                                   setVariants(updated)
                                 }}
                                 disabled={saving}
                               >
                                 <SelectTrigger className="h-8 text-xs">
                                   <SelectValue placeholder="No image" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="no_image">No image</SelectItem>
                                   {(product.images || []).map((img, idx) => (
                                     <SelectItem key={idx} value={img.url}>
                                       Image #{idx + 1}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                             <div className="flex items-center gap-1.5 px-1 flex-shrink-0">
                               <Checkbox
                                 id={`edit-var-instock-${index}`}
                                 checked={v.inStock}
                                 onCheckedChange={(checked) => {
                                   const updated = [...variants]
                                   updated[index].inStock = checked as boolean
                                   setVariants(updated)
                                 }}
                                 disabled={saving}
                               />
                               <Label htmlFor={`edit-var-instock-${index}`} className="text-xs font-normal text-muted-foreground cursor-pointer">InStock</Label>
                             </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                              onClick={() => setVariants(variants.filter((_, idx) => idx !== index))}
                              disabled={saving}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="space-y-2">
                <ImageUpload
                  initialImages={product.images?.map((img: any) => img.url) || []}
                  onUpload={(urls) => setProduct({
                    ...product,
                    images: urls.map((url, idx) => ({ url, alt: product.name, order: idx }))
                  })}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Checkbox id="featured" checked={product.isFeatured} onCheckedChange={(checked) => setProduct({ ...product, isFeatured: checked as boolean })} disabled={saving} />
                <Label htmlFor="featured" className="cursor-pointer">Featured Product</Label>
              </div>
              <div className="flex items-center space-x-4">
                <Checkbox id="inStock" checked={product.inStock} onCheckedChange={(checked) => setProduct({ ...product, inStock: checked as boolean })} disabled={saving} />
                <Label htmlFor="inStock" className="cursor-pointer">In Stock</Label>
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/admin/products" className="flex-1"><Button variant="outline" className="w-full" disabled={saving}>Cancel</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}