'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  Edit,
  HelpCircle,
  Loader2,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

interface AdminFaqRow {
  id: string
  question: string
  answer: string[]
  category: string
  bullets: string[]
  ordered: string[]
  image?: { src: string; alt: string }
  order: number
  displayPages: string[]
  createdAt: string
  updatedAt: string
}

interface FaqFormState {
  id?: string
  question: string
  answer: string
  category: string
  bullets: string
  ordered: string
  imageSrc: string
  imageAlt: string
  order: string
  displayPages: string
}

const emptyForm: FaqFormState = {
  question: '',
  answer: '',
  category: '',
  bullets: '',
  ordered: '',
  imageSrc: '',
  imageAlt: '',
  order: '0',
  displayPages: '/faq',
}

function toLines(values: string[]) {
  return (values || []).join('\n')
}

function fromFaq(faq: AdminFaqRow): FaqFormState {
  return {
    id: faq.id,
    question: faq.question,
    answer: toLines(faq.answer),
    category: faq.category,
    bullets: toLines(faq.bullets),
    ordered: toLines(faq.ordered),
    imageSrc: faq.image?.src || '',
    imageAlt: faq.image?.alt || '',
    order: String(faq.order ?? 0),
    displayPages: toLines(faq.displayPages),
  }
}

function toPayload(form: FaqFormState) {
  return {
    id: form.id,
    question: form.question.trim(),
    answer: form.answer,
    category: form.category.trim(),
    bullets: form.bullets,
    ordered: form.ordered,
    image: {
      src: form.imageSrc.trim(),
      alt: form.imageAlt.trim(),
    },
    order: Number(form.order) || 0,
    displayPages: form.displayPages,
  }
}

export default function AdminFaqsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [faqs, setFaqs] = useState<AdminFaqRow[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [displayPages, setDisplayPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [displayPageFilter, setDisplayPageFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FaqFormState>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<AdminFaqRow | null>(null)
  const limit = 20

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchFaqs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search.trim()) params.set('search', search.trim())
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (displayPageFilter !== 'all') params.set('displayPage', displayPageFilter)

      const res = await fetch(`/api/admin/faqs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.faqs || [])
        setCategories(data.categories || [])
        setDisplayPages(data.displayPages || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to fetch FAQs', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch FAQs', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, displayPageFilter, toast])

  useEffect(() => {
    if (status === 'authenticated') {
      void Promise.resolve().then(fetchFaqs)
    }
  }, [status, fetchFaqs])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      category: categoryFilter !== 'all' ? categoryFilter : '',
      displayPages: displayPageFilter !== 'all' ? displayPageFilter : '/faq',
    })
    setFormOpen(true)
  }

  const openEdit = (faq: AdminFaqRow) => {
    setForm(fromFaq(faq))
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.category.trim() || !form.answer.trim()) {
      toast({
        title: 'Missing details',
        description: 'Question, category, and answer are required.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/faqs', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: form.id ? 'FAQ updated' : 'FAQ created' })
        setFormOpen(false)
        setForm(emptyForm)
        fetchFaqs()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save FAQ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save FAQ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (faq: AdminFaqRow) => {
    try {
      const res = await fetch(`/api/admin/faqs?id=${faq.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'FAQ deleted' })
        fetchFaqs()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete FAQ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete FAQ', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setDisplayPageFilter('all')
    setPage(1)
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
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

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
          <Link href="/admin/contact-messages"><Button variant="ghost" size="sm">Contact Messages</Button></Link>
          <Link href="/admin/reviews"><Button variant="ghost" size="sm">Reviews</Button></Link>
          <Link href="/admin/discounts"><Button variant="ghost" size="sm">Discounts</Button></Link>
          <Link href="/admin/bulk-editor"><Button variant="ghost" size="sm">Bulk Editor</Button></Link>
          <Link href="/admin/tags"><Button variant="ghost" size="sm">Tags</Button></Link>
          <Link href="/admin/refunds"><Button variant="ghost" size="sm">Refunds</Button></Link>
          <Link href="/admin/blog"><Button variant="ghost" size="sm">Blog</Button></Link>
          <Link href="/admin/faqs"><Button variant="secondary" size="sm">FAQs</Button></Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">FAQ Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage public FAQ content, display pages, categories, order, bullets, and answer sections.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Search and narrow FAQs before editing.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_220px_220px_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="faq-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="faq-search"
                  placeholder="Search question, answer, category..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Display Page</Label>
              <Select
                value={displayPageFilter}
                onValueChange={(value) => {
                  setDisplayPageFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {displayPages.map((displayPage) => (
                    <SelectItem key={displayPage} value={displayPage}>
                      {displayPage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!search && categoryFilter === 'all' && displayPageFilter === 'all'}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading FAQs...</span>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 border-2 rounded-xl">
            <HelpCircle className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">No FAQs found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or add a new FAQ.</p>
          </div>
        ) : (
          <div className="border-2 rounded-xl overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Display Pages</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-lg">
                      <p className="font-medium line-clamp-2">{faq.question}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {faq.answer?.[0] || 'No answer'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{faq.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(faq.displayPages || []).length > 0 ? (
                          faq.displayPages.map((displayPage) => (
                            <Badge key={displayPage} variant="secondary" className="text-[10px]">
                              {displayPage}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{faq.order}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(faq.updatedAt || faq.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit FAQ" onClick={() => openEdit(faq)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete FAQ"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(faq)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages} ({total} FAQs)
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
            <DialogDescription>
              Use one line per paragraph, bullet, ordered step, or display page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="faq-question">Question *</Label>
              <Input
                id="faq-question"
                value={form.question}
                onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Can I customize my varsity jacket?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq-category">Category *</Label>
                <Input
                  id="faq-category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Varsity Jackets"
                  list="faq-category-options"
                />
                <datalist id="faq-category-options">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-order">Order</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faq-answer">Answer Paragraphs *</Label>
              <Textarea
                id="faq-answer"
                rows={5}
                value={form.answer}
                onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="Write one paragraph per line."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq-bullets">Bullets</Label>
                <Textarea
                  id="faq-bullets"
                  rows={4}
                  value={form.bullets}
                  onChange={(e) => setForm((prev) => ({ ...prev, bullets: e.target.value }))}
                  placeholder="One bullet per line"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-ordered">Ordered Steps</Label>
                <Textarea
                  id="faq-ordered"
                  rows={4}
                  value={form.ordered}
                  onChange={(e) => setForm((prev) => ({ ...prev, ordered: e.target.value }))}
                  placeholder="One step per line"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faq-display-pages">Display Pages</Label>
              <Textarea
                id="faq-display-pages"
                rows={3}
                value={form.displayPages}
                onChange={(e) => setForm((prev) => ({ ...prev, displayPages: e.target.value }))}
                placeholder="/faq&#10;/varsity-jackets"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="faq-image-src">Image URL</Label>
                <Input
                  id="faq-image-src"
                  value={form.imageSrc}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageSrc: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-image-alt">Image Alt</Label>
                <Input
                  id="faq-image-alt"
                  value={form.imageAlt}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageAlt: e.target.value }))}
                  placeholder="FAQ image description"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {form.id ? 'Save Changes' : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{deleteTarget?.question}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete FAQ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
