'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/image-upload'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Loader2, Save, X, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BlogCategory {
  id: string
  name: string
  slug: string
}

interface ProductOption {
  id: string
  name: string
}

export interface BlogPostFormValues {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  categories: string[]
  tags: string[]
  status: 'draft' | 'scheduled' | 'published'
  publishedAt: string
  seoTitle: string
  seoDescription: string
  ogImage: string
  taggedProducts: string[]
}

const emptyValues: BlogPostFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  categories: [],
  tags: [],
  status: 'draft',
  publishedAt: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  taggedProducts: [],
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function toDatetimeLocal(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BlogPostForm({
  mode,
  postId,
  initialValues,
  initialTaggedProductOptions = [],
}: {
  mode: 'create' | 'edit'
  postId?: string
  initialValues?: Partial<BlogPostFormValues>
  initialTaggedProductOptions?: ProductOption[]
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [values, setValues] = useState<BlogPostFormValues>({ ...emptyValues, ...initialValues })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit')
  const [tagsInput, setTagsInput] = useState((initialValues?.tags || []).join(', '))
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Tagged products picker state
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<ProductOption[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>(initialTaggedProductOptions)

  useEffect(() => {
    fetch('/api/admin/blog-categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([])
      return
    }
    setSearchingProducts(true)
    const timeout = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(productQuery)}&all=true&limit=10`)
        .then((r) => r.json())
        .then((data) => {
          const list: ProductOption[] = Array.isArray(data)
            ? data.map((p: any) => ({ id: p.id || p._id, name: p.name }))
            : []
          setProductResults(list)
        })
        .catch(() => setProductResults([]))
        .finally(() => setSearchingProducts(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [productQuery])

  const handleTitleChange = (title: string) => {
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }))
  }

  const toggleCategory = (id: string, checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, id] : prev.categories.filter((c) => c !== id),
    }))
  }

  const addProduct = (product: ProductOption) => {
    if (values.taggedProducts.includes(product.id)) return
    setValues((prev) => ({ ...prev, taggedProducts: [...prev.taggedProducts, product.id] }))
    setSelectedProducts((prev) => [...prev, product])
    setProductQuery('')
    setProductResults([])
  }

  const removeProduct = (id: string) => {
    setValues((prev) => ({ ...prev, taggedProducts: prev.taggedProducts.filter((p) => p !== id) }))
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const buildPayload = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: Record<string, any> = {
      title: values.title,
      slug: values.slug || slugify(values.title),
      excerpt: values.excerpt,
      content: values.content,
      featuredImage: values.featuredImage,
      categories: values.categories,
      tags,
      status: values.status,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
      ogImage: values.ogImage,
      taggedProducts: values.taggedProducts,
    }

    if (values.status === 'scheduled') {
      payload.publishedAt = values.publishedAt ? new Date(values.publishedAt).toISOString() : ''
    } else if (values.status === 'published' && values.publishedAt) {
      payload.publishedAt = new Date(values.publishedAt).toISOString()
    }

    return payload
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!values.title || !values.excerpt || !values.content) {
      setError('Title, excerpt, and content are required.')
      return
    }
    if (values.status === 'scheduled' && !values.publishedAt) {
      setError('A publish date is required for scheduled posts.')
      return
    }

    setSubmitting(true)
    try {
      const payload = buildPayload()
      const url = mode === 'create' ? '/api/admin/blog' : `/api/admin/blog/${postId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: mode === 'create' ? 'Post Created' : 'Post Updated',
          description: `The blog post was successfully ${mode === 'create' ? 'created' : 'updated'}.`,
        })
        router.push('/admin/blog')
      } else {
        const err = await res.json()
        if (res.status === 409) {
          setError(err.error || 'A post with this slug already exists.')
        } else {
          setError(err.error || `Failed to ${mode === 'create' ? 'create' : 'update'} post.`)
        }
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!postId) return
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Post Deleted', description: 'The blog post was successfully deleted.' })
        router.push('/admin/blog')
      } else {
        const err = await res.json()
        toast({
          title: 'Error Deleting Post',
          description: err.error || 'Failed to delete post.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true)
                setValues((prev) => ({ ...prev, slug: e.target.value }))
              }}
              placeholder={slugify(values.title) || 'auto-generated-from-title'}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">Leave blank to auto-generate from the title.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              rows={3}
              value={values.excerpt}
              onChange={(e) => setValues((prev) => ({ ...prev, excerpt: e.target.value }))}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <RichTextEditor
              content={values.content}
              onChange={(html) => setValues((prev) => ({ ...prev, content: html }))}
              placeholder="Write your post..."
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              label="Featured Image"
              maxImages={1}
              onUpload={(urls) => setValues((prev) => ({ ...prev, featuredImage: urls[urls.length - 1] || urls[0] || '' }))}
              initialImages={values.featuredImage ? [values.featuredImage] : []}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Categories</Label>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No categories yet. Add some from the Blog page.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/20">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={values.categories.includes(cat.id)}
                      onCheckedChange={(checked) => toggleCategory(cat.id, !!checked)}
                      disabled={submitting}
                    />
                    <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="fashion, summer, trends (comma-separated)"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => setValues((prev) => ({ ...prev, status: value as BlogPostFormValues['status'] }))}
                disabled={submitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {values.status === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Publish Date *</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={toDatetimeLocal(values.publishedAt) || values.publishedAt}
                  onChange={(e) => setValues((prev) => ({ ...prev, publishedAt: e.target.value }))}
                  required
                  disabled={submitting}
                />
              </div>
            )}
          </div>

          {/* SEO Section */}
          <div className="space-y-4 p-4 bg-muted/30 border rounded-xl">
            <Label className="text-sm font-semibold">SEO &amp; Social Sharing</Label>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={values.seoTitle}
                onChange={(e) => setValues((prev) => ({ ...prev, seoTitle: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea
                id="seoDescription"
                rows={2}
                value={values.seoDescription}
                onChange={(e) => setValues((prev) => ({ ...prev, seoDescription: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImage">OG Image URL</Label>
              <Input
                id="ogImage"
                type="url"
                placeholder="https://example.com/og-image.jpg"
                value={values.ogImage}
                onChange={(e) => setValues((prev) => ({ ...prev, ogImage: e.target.value }))}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Tagged Products */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tagged Products</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products to tag..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="pl-10"
                disabled={submitting}
              />
              {searchingProducts && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {productResults.length > 0 && (
              <div className="border rounded-lg divide-y bg-background shadow-sm max-h-48 overflow-y-auto">
                {productResults.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    disabled={values.taggedProducts.includes(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedProducts.map((p) => (
                  <Badge key={p.id} variant="outline" className="gap-1.5 pl-3 pr-1.5 py-1.5 text-xs font-medium">
                    {p.name}
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      className="rounded-full hover:bg-destructive/10 hover:text-destructive p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Post' : 'Save Changes'}
            </Button>
            <Link href="/admin/blog" className="flex-1">
              <Button variant="outline" className="w-full" type="button" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
