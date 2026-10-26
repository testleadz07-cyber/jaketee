'use client'

import { X } from 'lucide-react'
import { useFilterSearch, updateFilterUrl } from '@/hooks/use-url-filter'
import { readUrlFilter, writeUrlFilter, type UrlFilterValue } from '@/lib/url-filters'

export type FilterDefinition = { key: string; label: string; defaultValue: UrlFilterValue; clearValue?: UrlFilterValue }

export function AppliedUrlFilters({ filters }: { filters: FilterDefinition[] }) {
  const search = useFilterSearch()
  const params = new URLSearchParams(search)
  const chips = filters.flatMap<{ filter: FilterDefinition; value: string; array: string[] | null }>(filter => {
    const value = readUrlFilter(params, filter.key, filter.defaultValue)
    if (Array.isArray(value)) return value.map(item => ({ filter, value: item, array: value }))
    return value !== (filter.clearValue ?? filter.defaultValue) && value !== '' ? [{ filter, value: String(value), array: null }] : []
  })
  if (!chips.length) return null
  return <div aria-label="Applied filters" className="flex min-w-0 flex-wrap items-center gap-2 py-2">
    {chips.map(({ filter, value, array }) => <button key={`${filter.key}-${value}`} type="button"
      aria-label={`Remove ${filter.label}: ${value}`}
      onClick={() => updateFilterUrl(next => {
        writeUrlFilter(next, filter.key, array ? array.filter(item => item !== value) : filter.clearValue ?? filter.defaultValue, filter.defaultValue)
        next.delete('page')
      })}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border bg-card px-3 text-left text-xs">
      <span className="min-w-0 break-words">{filter.label}: {value}</span><X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
    </button>)}
    <button type="button" className="min-h-11 shrink-0 px-2 text-sm underline" onClick={() => updateFilterUrl(next => {
      filters.forEach(filter => writeUrlFilter(next, filter.key, filter.clearValue ?? (Array.isArray(filter.defaultValue) ? [] : filter.defaultValue), filter.defaultValue))
      next.delete('page')
    })}>{chips.length === 1 && chips[0].filter.key === 'search' ? 'Clear search' : 'Clear all filters'}</button>
  </div>
}
