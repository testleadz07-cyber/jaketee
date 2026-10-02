'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { AdminLoadingShell } from '@/components/admin/admin-loading-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Edit, Trash2, Check, ChevronLeft, LogOut, Tags as TagsIcon } from 'lucide-react'
import Link from 'next/link'

export default function TagsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

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
      if (!res.ok) throw new Error('Failed to add tag')
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
      toast({ title: 'Tag added', description: `${newTag.trim()} added successfully.` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Could not add tag.', variant: 'destructive' })
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
      if (!res.ok) throw new Error('Failed to rename')
      setTags(prev => prev.map(t => (t === editingTag ? editValue.trim() : t)))
      toast({ title: 'Tag renamed', description: `${editingTag} → ${editValue.trim()}` })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Could not rename tag.', variant: 'destructive' })
    } finally {
      setSaving(false)
      cancelEdit()
    }
  }

  const handleDelete = async (tag: string) => {
    if (!confirm(`Delete tag "${tag}"?`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setTags(prev => prev.filter(t => t !== tag))
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

        {/* Search */}
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {/* Tag list */}
        <ul className="space-y-2 max-w-lg">
          {tags.length === 0 && (
            <li className="text-muted-foreground text-sm py-4">No tags yet. Add your first tag above.</li>
          )}
          {tags.filter(t => t.toLowerCase().includes(search.toLowerCase())).length === 0 && tags.length > 0 && (
            <li className="text-muted-foreground text-sm py-4">No tags match &quot;{search}&quot;.</li>
          )}
          {tags.filter(t => t.toLowerCase().includes(search.toLowerCase())).map(tag => (
            <li key={tag} className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
              {editingTag === tag ? (
                <>
                  <Input value={editValue} onChange={e => setEditValue(e.target.value)} disabled={saving} className="h-8" />
                  <Button variant="outline" size="sm" onClick={handleRename} disabled={saving}><Check size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-sm">{tag}</span>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tag)} disabled={saving}><Edit size={16} /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(tag)} disabled={saving}><Trash2 size={16} /></Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
