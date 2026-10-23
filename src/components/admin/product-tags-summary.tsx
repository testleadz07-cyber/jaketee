'use client'

import { useState } from 'react'
import { ChevronDown, Tag } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function ProductTagsSummary({ tags, productName, onSelect }: {
  tags: string[]
  productName: string
  onSelect: (tag: string) => void
}) {
  const [open, setOpen] = useState(false)
  const uniqueTags = [...new Set(tags.filter(tag => tag.trim()))]

  if (!uniqueTags.length) {
    return <span className="inline-flex h-7 items-center gap-1.5 text-xs text-muted-foreground/70"><Tag className="h-3 w-3" aria-hidden="true" />No tags</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View ${uniqueTags.length} ${uniqueTags.length === 1 ? 'tag' : 'tags'} for ${productName}`}
          className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/70 px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="max-w-[100px] truncate sm:max-w-[160px]">{uniqueTags[0]}</span>
          {uniqueTags.length > 1 && <span className="shrink-0 border-l pl-1.5 text-[11px] tabular-nums">+{uniqueTags.length - 1}</span>}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 max-w-[calc(100vw-2rem)] p-2" aria-label={`Tags for ${productName}`}>
        <div className="border-b px-2 pb-2 pt-1">
          <p className="text-sm font-medium">Product tags <span className="text-xs font-normal text-muted-foreground">({uniqueTags.length})</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">Select a tag to filter products.</p>
        </div>
        <ul className="mt-1 max-h-56 overflow-y-auto">
          {uniqueTags.map(tag => (
            <li key={tag}>
              <button type="button" className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => { setOpen(false); onSelect(tag) }}>
                <Tag className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{tag}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
