"use client"

import { useEffect, useId, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet'
import { catalogFacets, emptyCatalogFilters, priceFilterError, type CatalogFilters, type CatalogFacetData } from '@/lib/catalog-filters'

export type CategoryFacetData = CatalogFacetData

function FilterFields({ value, onChange, facets }: { value: CatalogFilters; onChange: (value: CatalogFilters) => void; facets: CategoryFacetData }) {
  const id = useId()
  const error = priceFilterError(value)
  return <div className="min-w-0 space-y-6">
    {facets.maxPrice > facets.minPrice && <fieldset className="min-w-0"><legend className="mb-3 text-sm font-semibold">Price ($)</legend>
      <div className="grid grid-cols-2 gap-3">{(['minPrice', 'maxPrice'] as const).map((key, i) => <label key={key} className="min-w-0 text-xs text-muted-foreground">
        {i === 0 ? 'Minimum' : 'Maximum'}
        <input type="text" inputMode="decimal" value={value[key]} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-price-error` : undefined}
          placeholder={String(i === 0 ? facets.minPrice : facets.maxPrice)} onChange={event => onChange({ ...value, [key]: event.target.value })}
          className="mt-2 min-h-11 min-w-0 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground aria-invalid:border-destructive" />
      </label>)}</div>
      {error && <p id={`${id}-price-error`} role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>}
    {facets.groups.map(group => <fieldset key={group.key} className="min-w-0"><legend className="mb-2 text-sm font-semibold">{group.label}</legend><div className="space-y-1">{group.values.map(option => <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-sm"><input type="checkbox" checked={value[group.key].includes(option)} onChange={event => onChange({ ...value, [group.key]: event.target.checked ? [...value[group.key], option] : value[group.key].filter(item => item !== option) })} className="h-4 w-4 shrink-0 accent-red-800" /><span className="min-w-0 [overflow-wrap:anywhere]">{option}</span></label>)}</div></fieldset>)}
  </div>
}

export function CategoryFilters({ value, onApply, onClear, facets, mode }: { value: CatalogFilters; onApply: (value: CatalogFilters) => void; onClear?: (searchOnly: boolean) => void; facets: CategoryFacetData; mode: 'mobile' | 'desktop' }) {
  const [draftState, setDraftState] = useState({ source: value, value })
  const draft = draftState.source === value ? draftState.value : value
  const setDraft = (next: CatalogFilters) => setDraftState({ source: value, value: next })
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [value])
  const change = (next: CatalogFilters) => {
    clearTimeout(timer.current)
    setDraft(next)
    if (priceFilterError(next)) return
    if (next.minPrice !== draft.minPrice || next.maxPrice !== draft.maxPrice) timer.current = setTimeout(() => onApply(next), 450)
    else onApply(next)
  }
  const active = Boolean(draft.search || draft.minPrice || draft.maxPrice || Object.keys(catalogFacets).some(key => draft[key as keyof typeof catalogFacets].length))
  const searchOnly = Boolean(draft.search) && !draft.minPrice && !draft.maxPrice && !Object.keys(catalogFacets).some(key => draft[key as keyof typeof catalogFacets].length)
  const fields = <FilterFields value={draft} onChange={change} facets={facets} />
  const actions = <div className="grid gap-2">{mode === 'mobile' && <Button type="button" onClick={() => setOpen(false)} className="min-h-12">Done</Button>}{active && <Button type="button" variant="outline" className="min-h-11 border-input bg-card text-card-foreground" onClick={() => { clearTimeout(timer.current); setDraft(emptyCatalogFilters); if (onClear) onClear(searchOnly); else onApply(emptyCatalogFilters) }}>{searchOnly ? 'Clear search' : 'Clear all filters'}</Button>}</div>
  if (mode === 'desktop') return <aside className="sticky top-[calc(var(--site-header-height,8rem)+1rem)] hidden lg:block" aria-label="Filter products"><div className="flex max-h-[calc(100dvh-var(--site-header-height,8rem)-2rem)] flex-col overflow-hidden rounded-xl border bg-card"><div className="flex shrink-0 items-center gap-2 border-b px-4 py-4 text-sm font-semibold"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Filter products</div><div className="shrink-0 border-b bg-card p-4">{actions}</div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{fields}</div></div></aside>
  return <div className="lg:hidden"><Sheet open={open} onOpenChange={next => { if (next) setDraft(value); setOpen(next) }}><SheetTrigger asChild><Button variant="outline" className="h-12 w-full gap-2 rounded-xl bg-card text-card-foreground"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Filter</Button></SheetTrigger><SheetContent className="flex h-dvh min-w-0 w-full flex-col bg-background text-foreground sm:max-w-md"><SheetHeader><SheetTitle>Filter this collection</SheetTitle><SheetDescription>Results update automatically as you choose. Price changes apply after a short pause.</SheetDescription></SheetHeader><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{fields}</div><div className="shrink-0 border-t bg-background px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{actions}</div></SheetContent></Sheet></div>
}

export function AppliedCategoryFilters({ value, onChange, category, onRemoveCategory, onClearAll }: { value: CatalogFilters; onChange: (value: CatalogFilters) => void; category?: string; onRemoveCategory?: () => void; onClearAll?: () => void }) {
  const chips = [...(value.search ? [{ label: `Search: ${value.search}`, remove: () => onChange({ ...value, search: '' }) }] : []), ...(value.minPrice ? [{ label: `From $${value.minPrice}`, remove: () => onChange({ ...value, minPrice: '' }) }] : []), ...(value.maxPrice ? [{ label: `Up to $${value.maxPrice}`, remove: () => onChange({ ...value, maxPrice: '' }) }] : []), ...Object.entries(catalogFacets).flatMap(([key, name]) => value[key as keyof typeof catalogFacets].map(option => ({ label: `${name}: ${option}`, remove: () => onChange({ ...value, [key]: value[key as keyof typeof catalogFacets].filter(item => item !== option) }) }))) ]
  if (category && onRemoveCategory) chips.unshift({ label: `Category: ${category}`, remove: onRemoveCategory })
  return chips.length ? <div className="mb-5 flex min-w-0 flex-wrap gap-2" aria-label="Applied filters">{chips.map(chip => <button type="button" key={chip.label} onClick={chip.remove} aria-label={`Remove ${chip.label}`} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border bg-card px-3 text-left text-xs"><span className="min-w-0 break-words">{chip.label}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" /></button>)}{(chips.length > 1 || value.search) && <button type="button" onClick={() => onClearAll ? onClearAll() : onChange(emptyCatalogFilters)} className="min-h-11 px-2 text-sm underline">{chips.length === 1 && value.search ? 'Clear search' : 'Clear all filters'}</button>}</div> : null
}
