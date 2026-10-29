'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProductTagsEditor({ value, onChange, disabled, categoryId }: { categoryId?: string; value: string[]; onChange: (tags: string[]) => void; disabled?: boolean }) {
  const [suggestions, setSuggestions] = useState<{ categoryId: string; tags: string[]; error: string }>({ categoryId: '', tags: [], error: '' })
  const available = suggestions.categoryId === categoryId ? suggestions.tags : []
  const error = suggestions.categoryId === categoryId ? suggestions.error : ''
  const [draft, setDraft] = useState('')
  useEffect(() => {
    if (!categoryId) return
    const controller = new AbortController()
    fetch(`/api/admin/tags?categoryId=${encodeURIComponent(categoryId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(res => { if (!res.ok) throw new Error('Could not load existing tags'); return res.json() })
      .then(data => { if (!controller.signal.aborted) setSuggestions({ categoryId, tags: data.tags || [], error: '' }) })
      .catch(() => { if (!controller.signal.aborted) setSuggestions({ categoryId, tags: [], error: 'Could not load category tags. You can still enter a tag below.' }) })
    return () => controller.abort()
  }, [categoryId])
  const add = () => {
    const tag = draft.trim()
    if (tag) { onChange([...new Set([...value, tag])]); setDraft('') }
  }
  return <fieldset disabled={disabled} className="space-y-3 rounded-lg border p-4">
    <legend className="px-1 text-sm font-medium">Product tags</legend>
    <p className="text-xs text-muted-foreground">Suggestions come from products in the selected category. Current product tags stay visible. You can also add a new tag.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">
      {[...new Set([...available, ...value])].sort((a, b) => a.localeCompare(b)).map(tag => <label key={tag} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.includes(tag)} onChange={event => onChange(event.target.checked ? [...value, tag] : value.filter(item => item !== tag))} />{tag}
      </label>)}
    </div>
    <div className="flex gap-2">
      <Input aria-label="New product tag" placeholder="New tag name" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add() } }} />
      <Button type="button" variant="outline" onClick={add} disabled={disabled || !draft.trim()}>Add tag</Button>
    </div>
  </fieldset>
}
