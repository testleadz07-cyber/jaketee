'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'
import Image from '@/components/optimized-image'
import { Input } from '@/components/ui/input'
import { WhatsAppHelp } from '@/components/whatsapp-help'
import { buildProductUrl } from '@/lib/categories'
import { searchProductHref, type SearchMatch } from '@/lib/product-search'

interface SearchSuggestion {
  searchMatch?: SearchMatch
  id: string
  name: string
  slug: string
  thumbnail: string
  price: number
  categoryPath?: Array<{ name: string; slug: string }>
}

export function HeaderSearch({ className = '' }: { className?: string }) {
  const router = useRouter()
  const id = useId()
  const container = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const version = useRef(0)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const term = query.trim()
  const expanded = open && term.length >= 2
  const resultsUrl = `/shop?search=${encodeURIComponent(term)}`

  useEffect(() => {
    if (term.length < 2) return
    const controller = new AbortController()
    const requestVersion = version.current
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search-autocomplete?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        if (!response.ok) throw Error('Search unavailable')
        const data: unknown = await response.json()
        if (controller.signal.aborted || requestVersion !== version.current) return
        setSuggestions(Array.isArray(data) ? data.filter((item): item is SearchSuggestion => !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.slug === 'string' && typeof item.price === 'number').slice(0, 8) : [])
      } catch {
        if (!controller.signal.aborted && requestVersion === version.current) { setSuggestions([]); setFailed(true) }
      } finally {
        if (!controller.signal.aborted && requestVersion === version.current) setSearching(false)
      }
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [term])

  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [])

  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  function change(value: string) {
    if (value.trim() === term) { setQuery(value); setOpen(true); return }
    version.current++
    setQuery(value)
    setSuggestions([])
    setSearching(value.trim().length >= 2)
    setFailed(false)
    setActive(-1)
    setOpen(true)
  }
  function select(product: SearchSuggestion) {
    version.current++
    setOpen(false)
    setQuery('')
    setSuggestions([])
    setActive(-1)
    router.push(searchProductHref(buildProductUrl({ slug: product.slug, categoryPath: product.categoryPath }), product.searchMatch))
  }
  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { setOpen(false); setActive(-1); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!suggestions.length) return
      event.preventDefault()
      setOpen(true)
      setActive(current => event.key === 'ArrowDown' ? (current + 1) % suggestions.length : (current <= 0 ? suggestions.length : current) - 1)
    }
    if (event.key === 'Enter' && expanded && active >= 0 && suggestions[active]) { event.preventDefault(); select(suggestions[active]) }
  }

  return <div ref={container} className={`relative min-w-0 ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <form role="search" aria-label="Search Jacketee products" onSubmit={event => { event.preventDefault(); if (term) { setOpen(false); router.push(resultsUrl) } }} className="relative">
      <label htmlFor={`${id}-input`} className="sr-only">Search products by name or style</label>
      <Input ref={input} id={`${id}-input`} name="search" type="search" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-results` : undefined} aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined} autoComplete="off" placeholder="Search jackets, hoodies & more" value={query} onChange={event => change(event.target.value)} onFocus={() => setOpen(true)} onKeyDown={handleKey} className="h-12 rounded-xl bg-card pr-24 pl-4 text-base text-card-foreground shadow-none [&::-webkit-search-cancel-button]:hidden" />
      {query && <button type="button" aria-label="Clear product search" onClick={() => { change(''); input.current?.focus() }} className="absolute inset-y-0 right-12 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"><X aria-hidden="true" className="h-4 w-4" /></button>}
      <button type="submit" aria-label="Search products" className="absolute inset-y-0.5 right-0.5 flex w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Search aria-hidden="true" className="h-5 w-5" /></button>
    </form>
    {expanded && <div className="absolute inset-x-0 top-full z-[70] mt-2 max-h-[min(28rem,65dvh)] overflow-y-auto overscroll-contain rounded-xl border bg-popover text-popover-foreground shadow-xl">
      <p role="status" aria-live="polite" className="px-4 pt-4 pb-2 text-xs text-muted-foreground">{searching ? 'Searching products…' : failed ? 'Suggestions are temporarily unavailable. You can still search the shop.' : suggestions.length ? `${suggestions.length} suggestions. Use the up and down arrows to choose.` : `No suggestions for “${term}”. Try the full shop search below.`}</p>
      {searching && <div className="flex justify-center py-4"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /></div>}
      <ul id={`${id}-results`} role="listbox" aria-label="Product suggestions" className="p-2">{suggestions.map((product, index) => <li key={product.id} role="presentation"><button id={`${id}-option-${index}`} role="option" aria-selected={active === index} type="button" tabIndex={-1} onPointerDown={event => event.preventDefault()} onClick={() => select(product)} className={`flex min-h-16 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent ${active === index ? 'bg-accent' : ''}`}><span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">{product.thumbnail && <Image src={product.thumbnail} alt="" fill sizes="48px" className="object-contain" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5">{product.name}</span>{product.searchMatch?.options && <span className="mt-1 block text-xs text-muted-foreground">Available: {Object.values(product.searchMatch.options).join(' · ')}</span>}<span className="mt-1 block text-sm font-semibold text-primary">${product.price.toFixed(2)}</span></span></button></li>)}</ul>
      <Link href={resultsUrl} onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-between gap-3 border-t px-4 py-3 text-sm font-semibold text-primary hover:bg-accent">View all search results<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
      {!searching && !failed && !suggestions.length && <div className="border-t px-4 pb-3"><WhatsAppHelp message={`I am looking for ${term}. Can you help me find the right jacket?`} /></div>}
    </div>}
  </div>
}
