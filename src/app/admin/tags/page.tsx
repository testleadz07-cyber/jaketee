'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useUrlFilter } from '@/hooks/use-url-filter'
import { AppliedUrlFilters } from '@/components/applied-url-filters'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { AdminLoadingShell } from '@/components/admin/admin-loading-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Check, ChevronLeft, ChevronRight, Search, Tags as TagsIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function TagsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [tags, setTags] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useUrlFilter<string>('search', '')
  const [letter, setLetter] = useUrlFilter<string>('letter', 'all')
  const [sortOrder, setSortOrder] = useUrlFilter<string>('sort', 'asc')
  const [pageSize, setPageSize] = useUrlFilter<number>('limit', 10)
  const [page, setPage] = useUrlFilter<number>('page', 1)

  const filteredTags = tags
    .filter(tag => tag.toLowerCase().includes(search.trim().toLowerCase()))
    .filter(tag => letter === 'all' || (letter === 'other'
      ? !/^[a-z]/i.test(tag.trim())
      : tag.trim().toLowerCase().startsWith(letter)))
    .sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleTags = filteredTags.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/admin/tags')
        if (!res.ok) throw new Error('Failed to fetch tags')
        const data = await res.json()
        setTags(data.tags)
        setCounts(Object.fromEntries((data.usage || []).map((item: { name: string; productCount: number }) => [item.name, item.productCount])))
      } catch (error) {
        console.error(error)
        toast({
          title: 'Error',
          description: 'Could not load tags.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [])

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add tag')
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
      toast({ title: 'Tag added', description: `${newTag.trim()} added successfully.` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Could not add tag.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (tag: string) => {
    setEditingTag(tag)
    setEditValue(tag)
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setEditValue('')
  }

  const handleRename = async () => {
    if (!editingTag) return
    if (!editValue.trim() || editValue.trim() === editingTag) {
      cancelEdit()
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTag: editingTag, newTag: editValue.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to rename')
      setTags(prev => prev.map(t => (t === editingTag ? editValue.trim() : t)))
      setCounts(prev => ({ ...prev, [editValue.trim()]: prev[editingTag] || 0 }))
      toast({ title: 'Tag renamed', description: `${editingTag} → ${editValue.trim()}` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Could not rename tag.', variant: 'destructive' })
    } finally {
      setSaving(false)
      cancelEdit()
    }
  }

  const handleDelete = async (tag: string) => {
    if (!confirm(`Delete tag "${tag}" and remove it from ${counts[tag] || 0} products?`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setTags(prev => prev.filter(t => t !== tag))
      setPage(visibleTags.length === 1 ? Math.max(1, currentPage - 1) : currentPage)
      toast({ title: 'Tag deleted', description: `${tag} removed.` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Could not delete tag.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <AdminLoadingShell label="Loading tags..." />
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

      {/* Main */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <AppliedUrlFilters filters={[{ key: 'search', label: 'Search', defaultValue: '' }, { key: 'letter', label: 'Letter', defaultValue: 'all' }, { key: 'sort', label: 'Sort', defaultValue: 'asc' }]} />
        <div className="flex items-center gap-2 mb-2">
          <TagsIcon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Tag Management</h2>
        </div>
        <p className="text-muted-foreground text-sm">Create and manage product tags like &quot;New Arrival&quot; or &quot;Summer Sale&quot;. Tags are applied to products from the Bulk Editor or product edit form.</p>

        {/* Add new tag */}
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            placeholder="New tag name"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            disabled={saving}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} disabled={saving || !newTag.trim()}>Add</Button>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tag-search">Search tags</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="tag-search" placeholder="Search by tag name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-letter">Starts with</Label>
              <Select value={letter} onValueChange={value => { setLetter(value); setPage(1) }}>
                <SelectTrigger id="tag-letter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All letters</SelectItem>
                  {'abcdefghijklmnopqrstuvwxyz'.split('').map(value => <SelectItem key={value} value={value}>{value.toUpperCase()}</SelectItem>)}
                  <SelectItem value="other">Numbers &amp; symbols</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-sort">Sort by</Label>
              <Select value={sortOrder} onValueChange={value => { setSortOrder(value); setPage(1) }}>
                <SelectTrigger id="tag-sort"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Name: A–Z</SelectItem>
                  <SelectItem value="desc">Name: Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-page-size">Tags per page</Label>
              <Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setPage(1) }}>
                <SelectTrigger id="tag-page-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map(value => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(search || letter !== 'all' || sortOrder !== 'asc') && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setLetter('all'); setSortOrder('asc'); setPage(1) }}>Clear filters</Button>
          )}
        </div>

        {/* Tag list */}
        <ul className="space-y-2 max-w-3xl">
          {tags.length === 0 && (
            <li className="text-muted-foreground text-sm py-4">No tags yet. Add your first tag above.</li>
          )}
          {filteredTags.length === 0 && tags.length > 0 && (
            <li className="text-muted-foreground text-sm py-4">No tags match your search and filters.</li>
          )}
          {visibleTags.map(tag => (
            <li key={tag} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
              {editingTag === tag ? (
                <>
                  <Input value={editValue} onChange={e => setEditValue(e.target.value)} disabled={saving} className="h-8" />
                  <Button variant="outline" size="sm" onClick={handleRename} disabled={saving}><Check size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-sm break-words min-w-0">{tag}</span>
                  <span className="text-xs text-muted-foreground">{counts[tag] || 0} products</span>
                  <Button variant="outline" size="sm" asChild><Link href={`/admin/products?${new URLSearchParams({ tag }).toString()}`}>View products</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tag)} disabled={saving}><Edit size={16} /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(tag)} disabled={saving}><Trash2 size={16} /></Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <p className="text-sm text-muted-foreground" role="status">
            Showing {filteredTags.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredTags.length)} of {filteredTags.length} tags
            {filteredTags.length !== tags.length && ` (${tags.length} total)`}
          </p>
          <nav aria-label="Tags pagination" className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </main>
    </div>
  )
}
