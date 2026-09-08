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
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogOut, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import { useToast } from '@/hooks/use-toast'
import { AdminLoadingShell } from '@/components/admin/admin-loading-shell'
import {
  orderCategoriesForDisplay,
  resolveAncestorChain,
  isJacketCategoryPath,
  isVarsityJacketPath,
  DEFAULT_VARSITY_EMBROIDERY,
  DEFAULT_VARSITY_MEASUREMENT_FIELDS,
} from '@/lib/categories'

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
  ],
  'varsity-jackets': [
    { name: 'Style', label: 'Styles', values: ['Hooded', 'Retro', 'Satin'] },
    { name: 'Material', label: 'Materials', values: ['Wool & Leather', 'All Wool', 'Faux Leather', 'All Leather'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Navy', 'Cream'] },
    { name: 'Lining', label: 'Linings', values: ['Fleece', 'Satin', 'Cotton Twill'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'bomber-jackets': [
    { name: 'Material', label: 'Materials', values: ['Nylon', 'Leather', 'Cotton'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Olive', 'Navy'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'coach-jackets': [
    { name: 'Material', label: 'Materials', values: ['Nylon', 'Cotton Twill'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Khaki', 'Navy'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'denim-jackets': [
    { name: 'Color', label: 'Washes', values: ['Light Wash', 'Dark Wash', 'Black'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'fleece-hoodies': [
    { name: 'Color', label: 'Colors', values: ['Black', 'Gray', 'Navy'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'leather-jackets': [
    { name: 'Material', label: 'Materials', values: ['Genuine Leather', 'Faux Leather'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Brown'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
  'puffer-jackets': [
    { name: 'Material', label: 'Materials', values: ['Down', 'Synthetic Fill'] },
    { name: 'Color', label: 'Colors', values: ['Black', 'Navy', 'Olive'] },
    { name: 'Size', label: 'Sizes', values: ['S', 'M', 'L', 'XL'] },
  ],
}

export default function EditProduct() {
  const params = useParams()
  const productId = params.id as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [measurementInput, setMeasurementInput] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      Promise.all([
        fetch(`/api/products/${productId}`, { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/categories', { cache: 'no-store' }).then(r => r.json()),
      ]).then(([prod, cats]) => {
        setProduct(prod)
        setCategories(cats)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [status, router, productId])

  // Depth-first, indented ordering so the category dropdown reads as a tree
  // instead of a flat, ambiguous list once subcategories exist.
  const categoryNodes = categories.map((c) => ({ ...c, _id: c.id }))
  const orderedCategories = orderCategoriesForDisplay(categoryNodes)

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
        const errorData = await res.json().catch(() => ({}))
        toast({
          title: 'Failed to save product',
          description: errorData.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Failed to save product',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <AdminLoadingShell label="Loading product..." />
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

  const activeCategoryId =
    product.category?._id ||
    (typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id)
  const isJacketCategory = activeCategoryId
    ? isJacketCategoryPath(resolveAncestorChain(categoryNodes, activeCategoryId))
    : false
  const embroidery = product.embroidery || { available: false, fee: 0, maxChars: 20 }
  const measurementFields: string[] = product.measurementFields || []

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

                      // Varsity Jackets (and its subcategories) get the full
                      // customization builder enabled by default, unless this
                      // product already has customization settings configured.
                      const chain = resolveAncestorChain(categoryNodes, value)
                      const hasExistingCustomization =
                        !!product.embroidery?.available || (product.measurementFields || []).length > 0
                      const customizationUpdates = isVarsityJacketPath(chain) && !hasExistingCustomization
                        ? { embroidery: DEFAULT_VARSITY_EMBROIDERY, measurementFields: DEFAULT_VARSITY_MEASUREMENT_FIELDS }
                        : {}

                      setProduct({
                        ...product,
                        categoryId: value,
                        variants: newVariants,
                        ...customizationUpdates,
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
                                const existing = new Set(
                                  variants.filter((v: VariantInput) => v.name === sug.name).map((v: VariantInput) => v.value)
                                )
                                const newRows = sug.values
                                  .filter(val => !existing.has(val))
                                  .map(val => ({
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

              {isJacketCategory && (
                <div className="space-y-4 p-4 bg-muted/30 border rounded-xl">
                  <Label className="text-sm font-semibold">Jacket Customization</Label>

                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="embroidery-available"
                        checked={embroidery.available}
                        onCheckedChange={(checked) => setProduct({ ...product, embroidery: { ...embroidery, available: checked as boolean } })}
                        disabled={saving}
                      />
                      <Label htmlFor="embroidery-available" className="cursor-pointer text-sm font-medium">
                        Allow Embroidery / Monogram
                      </Label>
                    </div>
                    {embroidery.available && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label htmlFor="embroidery-fee" className="text-xs text-muted-foreground">Fee ($)</Label>
                          <Input
                            id="embroidery-fee"
                            type="number"
                            step="0.01"
                            value={embroidery.fee}
                            onChange={(e) => setProduct({ ...product, embroidery: { ...embroidery, fee: parseFloat(e.target.value) || 0 } })}
                            onFocus={(e) => e.target.select()}
                            className="h-8 text-xs"
                            disabled={saving}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="embroidery-maxchars" className="text-xs text-muted-foreground">Max Characters</Label>
                          <Input
                            id="embroidery-maxchars"
                            type="number"
                            value={embroidery.maxChars}
                            onChange={(e) => setProduct({ ...product, embroidery: { ...embroidery, maxChars: parseInt(e.target.value) || 20 } })}
                            onFocus={(e) => e.target.select()}
                            className="h-8 text-xs"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <Label className="text-sm font-medium">Made-to-Measure Fields</Label>
                    <p className="text-xs text-muted-foreground">
                      Body measurements customers can enter instead of a standard size (e.g. Chest, Shoulder, Sleeve Length).
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Field name (e.g. Chest)"
                        value={measurementInput}
                        onChange={(e) => setMeasurementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const label = measurementInput.trim()
                            if (label && !measurementFields.includes(label)) {
                              setProduct({ ...product, measurementFields: [...measurementFields, label] })
                            }
                            setMeasurementInput('')
                          }
                        }}
                        className="h-8 text-xs"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const label = measurementInput.trim()
                          if (label && !measurementFields.includes(label)) {
                            setProduct({ ...product, measurementFields: [...measurementFields, label] })
                          }
                          setMeasurementInput('')
                        }}
                        disabled={saving}
                      >
                        Add
                      </Button>
                    </div>
                    {measurementFields.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {measurementFields.map((field) => (
                          <Badge key={field} variant="secondary" className="gap-1.5">
                            {field}
                            <button
                              type="button"
                              onClick={() => setProduct({ ...product, measurementFields: measurementFields.filter((f) => f !== field) })}
                              disabled={saving}
                              className="hover:text-destructive"
                            >
                              ✕
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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