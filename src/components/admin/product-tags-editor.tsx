'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ProductTagsEditor({ value, onChange, disabled }: { value: string[]; onChange: (tags: string[]) => void; disabled?: boolean }) {
  const [available, setAvailable] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/tags', { signal: controller.signal, cache: 'no-store' })
      .then(res => { if (!res.ok) throw new Error('Could not load existing tags'); return res.json() })
      .then(data => setAvailable(data.tags || []))
      .catch(() => { if (!controller.signal.aborted) setError('Could not load existing tags. You can still enter a tag below.') })
    return () => controller.abort()
  }, [])
  const add = () => {
    const tag = draft.trim()
    if (tag) { onChange([...new Set([...value, tag])]); setDraft('') }
  }
  return <fieldset disabled={disabled} className="space-y-3 rounded-lg border p-4">
    <legend className="px-1 text-sm font-medium">Product tags</legend>
    <p className="text-xs text-muted-foreground">Select existing tags or add a new one. Changes are saved with the product.</p>
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
