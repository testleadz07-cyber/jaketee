'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-fetch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface InvoiceCustomer {
  id: string
  name: string
  email: string
  phone?: string | null
  addresses?: Array<{ name: string; street: string; city: string; state?: string; zip: string; country?: string; phone?: string; isDefault?: boolean }>
}
export interface InvoiceCatalogProduct {
  id?: string
  _id: string
  name: string
  price: number
}

async function customers(search: string, signal: AbortSignal): Promise<InvoiceCustomer[]> {
  const params = new URLSearchParams({ search, role: 'customer', status: 'active', limit: '8' })
  const res = await apiFetch(`/api/admin/users?${params}`, { signal })
  if (!res.ok) throw new Error('Customer search is unavailable. You can still enter details manually.')
  const data = await res.json()
  return Array.isArray(data.users) ? data.users : []
}
async function products(search: string, signal: AbortSignal): Promise<InvoiceCatalogProduct[]> {
  const params = new URLSearchParams({ search, all: 'true', limit: '8' })
  const res = await apiFetch(`/api/products?${params}`, { signal })
  if (!res.ok) throw new Error('Product search is unavailable. You can still enter details manually.')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

function RecordPicker<T>({ label, placeholder, load, describe, onSelect }: {
  label: string; placeholder: string; load: (query: string, signal: AbortSignal) => Promise<T[]>
  describe: (item: T) => { id: string; title: string; subtitle: string }
  onSelect: (item: T) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ query: string; items: T[]; status: 'loading' | 'ready' | 'error'; error?: string }>({ query: '', items: [], status: 'loading' })
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setResult({ query, items: [], status: 'loading' })
      try {
        const items = await load(query.trim(), controller.signal)
        if (!controller.signal.aborted) setResult({ query, items, status: 'ready' })
      } catch (err) {
        if (!controller.signal.aborted) setResult({ query, items: [], status: 'error', error: err instanceof Error ? err.message : 'Search unavailable. Enter details manually.' })
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [open, query, load])

  const waiting = result.query !== query || result.status === 'loading'
  return <div className="space-y-2" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <Label className="grid gap-2 text-xs">{label}
      <Input autoComplete="off" placeholder={placeholder} value={query} maxLength={160} onFocus={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setOpen(true) }} onKeyDown={event => {
          if (event.key === 'Enter') event.preventDefault()
          if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) }
        }} />
    </Label>
    {open && <div className="rounded-lg border bg-background" aria-label={`${label} results`}>
      <div className="max-h-52 overflow-y-auto" aria-live="polite">
        {waiting ? <p className="flex items-center gap-2 p-3 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Loading…</p>
          : result.status === 'error' ? <p role="status" className="p-3 text-xs text-destructive">{result.error}</p>
          : !result.items.length ? <p className="p-3 text-xs text-muted-foreground">No matches found. Enter the details manually below.</p>
          : result.items.map(item => {
            const option = describe(item)
            return <button key={option.id} type="button" className="block w-full border-b p-3 text-left last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none" onClick={() => { onSelect(item); setOpen(false); setQuery('') }}>
              <span className="block text-sm font-medium break-words">{option.title}</span><span className="block text-xs text-muted-foreground break-words">{option.subtitle}</span>
            </button>
          })}
      </div>
      <div className="border-t p-1"><Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setQuery('') }}>Enter manually</Button></div>
    </div>}
  </div>
}

export function InvoiceCustomerPicker({ onSelect }: { onSelect: (customer: InvoiceCustomer) => void }) {
  return <RecordPicker label="Select existing customer" placeholder="Search customers by name or email…" load={customers}
    describe={customer => ({ id: customer.id, title: customer.name, subtitle: customer.email })} onSelect={onSelect} />
}
export function InvoiceProductPicker({ onSelect }: { onSelect: (product: InvoiceCatalogProduct) => void }) {
  return <RecordPicker label="Select catalog product" placeholder="Search products by name…" load={products}
    describe={product => ({ id: product.id || product._id, title: product.name, subtitle: `$${product.price.toFixed(2)}` })} onSelect={onSelect} />
}
