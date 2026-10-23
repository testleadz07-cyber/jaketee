"use client"

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet'
import { catalogFacets, emptyCatalogFilters, type CatalogFilters, type CatalogFacetData } from '@/lib/catalog-filters'

export type CategoryFacetData = CatalogFacetData

function FilterFields({ value, onChange, facets }: { value: CatalogFilters; onChange: (value: CatalogFilters) => void; facets: CategoryFacetData }) {
  return <div className="space-y-6">
    {facets.maxPrice > facets.minPrice && <fieldset><legend className="mb-3 text-sm font-semibold">Price ($)</legend><div className="grid grid-cols-2 gap-2">{(['minPrice', 'maxPrice'] as const).map((key, i) => <label key={key} className="text-xs text-muted-foreground">{i === 0 ? 'Minimum' : 'Maximum'}<input type="number" inputMode="decimal" min="0" step="any" value={value[key]} placeholder={String(i === 0 ? facets.minPrice : facets.maxPrice)} onChange={event => onChange({ ...value, [key]: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground" /></label>)}</div>{value.minPrice && value.maxPrice && Number(value.minPrice) > Number(value.maxPrice) && <p role="alert" className="mt-2 text-xs text-destructive">Minimum must be below maximum.</p>}</fieldset>}
    {facets.groups.map(group => <fieldset key={group.key}><legend className="mb-2 text-sm font-semibold">{group.label}</legend><div className="space-y-1">{group.values.map(option => <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-sm"><input type="checkbox" checked={value[group.key].includes(option)} onChange={event => onChange({ ...value, [group.key]: event.target.checked ? [...value[group.key], option] : value[group.key].filter(item => item !== option) })} className="h-4 w-4 accent-red-800" />{option}</label>)}</div></fieldset>)}
  </div>
}

export function CategoryFilters({ value, onApply, facets, mode }: { value: CatalogFilters; onApply: (value: CatalogFilters) => void; facets: CategoryFacetData; mode: 'mobile' | 'desktop' }) {
  const [draft, setDraft] = useState(value)
  const [open, setOpen] = useState(false)
  const invalid = [draft.minPrice, draft.maxPrice].some(price => price !== '' && (!Number.isFinite(Number(price)) || Number(price) < 0)) || Boolean(draft.minPrice && draft.maxPrice && Number(draft.minPrice) > Number(draft.maxPrice))
  const fields = <FilterFields value={draft} onChange={setDraft} facets={facets} />
  const actions = <div className="grid gap-2"><Button disabled={invalid} onClick={() => { onApply(draft); setOpen(false) }} className="min-h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Show results</Button><Button variant="outline" className="min-h-11 border-input bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => { setDraft(emptyCatalogFilters); onApply(emptyCatalogFilters); setOpen(false) }}>Clear all filters</Button></div>
  if (mode === 'desktop') return <aside className="sticky top-24 hidden lg:block" aria-label="Filter products"><div className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-xl border bg-card"><div className="flex shrink-0 items-center gap-2 border-b px-4 py-4 text-sm font-semibold"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Filter products</div><div className="shrink-0 border-b bg-card p-4">{actions}</div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{fields}</div></div></aside>
  return <div className="lg:hidden"><Sheet open={open} onOpenChange={next => { if (next) setDraft(value); setOpen(next) }}><SheetTrigger asChild><Button variant="outline" className="h-12 w-full gap-2 rounded-xl bg-card text-card-foreground"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Filter</Button></SheetTrigger><SheetContent className="flex h-dvh w-full flex-col bg-background text-foreground sm:max-w-md"><SheetHeader><SheetTitle>Filter this collection</SheetTitle><SheetDescription>Choose your preferences, then show matching jackets.</SheetDescription></SheetHeader><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{fields}</div><div className="shrink-0 border-t bg-background px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{actions}</div></SheetContent></Sheet></div>
}

export function AppliedCategoryFilters({ value, onChange }: { value: CatalogFilters; onChange: (value: CatalogFilters) => void }) {
  const chips = [...(value.search ? [{ label: `Search: ${value.search}`, remove: () => onChange({ ...value, search: '' }) }] : []), ...(value.minPrice ? [{ label: `From $${value.minPrice}`, remove: () => onChange({ ...value, minPrice: '' }) }] : []), ...(value.maxPrice ? [{ label: `Up to $${value.maxPrice}`, remove: () => onChange({ ...value, maxPrice: '' }) }] : []), ...Object.entries(catalogFacets).flatMap(([key, name]) => value[key as keyof typeof catalogFacets].map(option => ({ label: `${name}: ${option}`, remove: () => onChange({ ...value, [key]: value[key as keyof typeof catalogFacets].filter(item => item !== option) }) }))) ]
  return chips.length ? <div className="mb-5 flex flex-wrap gap-2" aria-label="Applied filters">{chips.map(chip => <button key={chip.label} onClick={chip.remove} className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-3 text-xs">{chip.label}<X aria-hidden="true" className="h-3 w-3" /><span className="sr-only">Remove filter</span></button>)}<button onClick={() => onChange(emptyCatalogFilters)} className="min-h-11 px-2 text-sm underline">Clear all</button></div> : null
}
