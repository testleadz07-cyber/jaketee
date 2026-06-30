'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  FolderOpen,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  _id?: string
  name: string
  slug: string
  description?: string
  image?: string
  _count?: {
    products: number
  }
}

export default function AdminCategories() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null)
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    image: ''
  })

  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [status])

  // Slug auto generation
  const handleNameChangeAdd = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setNewCategory(prev => ({ ...prev, name: val, slug }))
  }

  const handleNameChangeEdit = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setEditForm(prev => ({ ...prev, name: val, slug }))
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        // Detect fallback mock data
        const first = data[0]
        if (first && first._id && !first.id) {
          // static-data system categories are used
          setIsDemoMode(true)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Creating categories is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (res.ok) {
        toast({
          title: 'Category Created',
          description: 'New category has been added successfully.'
        })
        setNewCategory({ name: '', slug: '', description: '', image: '' })
        setIsAddOpen(false)
        fetchCategories()
      } else {
        const err = await res.json()
        toast({
          title: 'Error Creating Category',
          description: err.error || 'Failed to create category.',
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

  const handleEditOpen = (category: Category) => {
    setEditingCategory(category)
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Editing categories is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/categories/${editingCategory.id || editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        toast({
          title: 'Category Updated',
          description: 'Category has been updated successfully.'
        })
        setIsEditOpen(false)
        setEditingCategory(null)
        fetchCategories()
      } else {
        const err = await res.json()
        toast({
          title: 'Error Updating Category',
          description: err.error || 'Failed to update category.',
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

  const handleDelete = (category: Category) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Deleting categories is disabled when database is not connected.',
        variant: 'destructive'
      })
      return
    }

    if (category._count && category._count.products > 0) {
      toast({
        title: 'Cannot Delete Category',
        description: `This category has ${category._count.products} products linked to it. Please re-assign or delete those products first.`,
        variant: 'destructive'
      })
      return
    }

    setDeleteCategoryTarget(category)
  }

  const executeDeleteCategory = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories/${category.id || category._id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Category Deleted',
          description: 'Category has been deleted successfully.'
        })
        fetchCategories()
        setDeleteCategoryTarget(null)
      } else {
        const err = await res.json()
        toast({
          title: 'Error Deleting Category',
          description: err.error || 'Failed to delete category.',
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading categories...</p>
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
            <Button variant="ghost" size="sm">Products</Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="secondary" size="sm">Categories</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">Orders</Button>
          </Link>
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
        </div>
      </nav>

      {/* Main Body */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs">
              <strong>Database not connected.</strong> Using read-only static category data. CRUD operations are disabled.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Categories</h2>
            <p className="text-muted-foreground text-sm">Create and modify product categories</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} disabled={isDemoMode} className="gap-1">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Card key={category.id || category._id} className="border-2 flex flex-col h-full bg-card hover:border-primary transition-all duration-300">
                {category.image && (
                  <div className="relative h-40 bg-muted overflow-hidden border-b">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{category.name}</CardTitle>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                      {category._count?.products || 0} products
                    </span>
                  </div>
                  <CardDescription className="font-mono text-xs mt-1">/{category.slug}</CardDescription>
                  {category.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2 line-clamp-3">
                      {category.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="border-t pt-4 flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleEditOpen(category)}
                    disabled={isDemoMode}
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(category)}
                    disabled={isDemoMode}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border rounded-xl bg-card border-dashed">
              <FolderOpen className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No categories found</p>
            </div>
          )}
        </div>
      </main>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category for products in the catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={newCategory.name}
                onChange={e => handleNameChangeAdd(e.target.value)}
                placeholder="e.g. Activewear"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-slug">Slug (Auto-generated)</Label>
              <Input
                id="add-slug"
                value={newCategory.slug}
                onChange={e => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. activewear"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-desc">Description</Label>
              <Textarea
                id="add-desc"
                value={newCategory.description}
                onChange={e => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary of category contents..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-image">Image URL</Label>
              <Input
                id="add-image"
                value={newCategory.image}
                onChange={e => setNewCategory(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://unsplash.com/..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update details for this product category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => handleNameChangeEdit(e.target.value)}
                placeholder="e.g. Activewear"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={e => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. activewear"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary of category contents..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={editForm.image}
                onChange={e => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://unsplash.com/..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteCategoryTarget} onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              {" "}<span className="font-semibold text-foreground">"{deleteCategoryTarget?.name}"</span> and all of its associated definitions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteCategoryTarget) {
                  executeDeleteCategory(deleteCategoryTarget)
                }
              }}
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
