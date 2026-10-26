'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const collectionKey = 'jacketee-collection-return'
const guideKey = 'jacketee-size-guide-return'
const eventName = 'jacketee-browsing-context'
const allowedQuery = new Set(['category', 'search', 'minPrice', 'maxPrice', 'size', 'color', 'material', 'fit', 'sort', 'page'])
type Context = { href: string; label: string; destination?: string }

function safeContext(raw: string): Context | null {
  try {
    const value = JSON.parse(raw)
    if (typeof value.href !== 'string' || !value.href.startsWith('/') || value.href.startsWith('//') || /[\\\r\n]/.test(value.href)) return null
    const url = new URL(value.href, 'https://jacketee.invalid')
    if (url.origin !== 'https://jacketee.invalid' || /^\/(admin|checkout|profile|login|register|auth)(\/|$)/.test(url.pathname)) return null
    return { href: url.pathname + url.search, label: String(value.label || 'Back to shop').slice(0, 100), destination: typeof value.destination === 'string' ? value.destination : undefined }
  } catch { return null }
}

function currentHref() {
  const url = new URL(window.location.href)
  for (const key of [...url.searchParams.keys()]) if (!allowedQuery.has(key)) url.searchParams.delete(key)
  return url.pathname + url.search
}

function save(key: string, context: Context) {
  const raw = JSON.stringify(context)
  if (!safeContext(raw)) return
  try { sessionStorage.setItem(key, raw); window.dispatchEvent(new Event(eventName)) } catch { /* Navigation still works when storage is unavailable. */ }
}

const subscribe = (callback: () => void) => {
  window.addEventListener(eventName, callback)
  window.addEventListener('storage', callback)
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener('storage', callback) }
}
const serverSnapshot = () => ''
function useContext(key: string) {
  const raw = useSyncExternalStore(subscribe, () => { try { return sessionStorage.getItem(key) || '' } catch { return '' } }, serverSnapshot)
  return safeContext(raw)
}

/** Record only internal catalog navigation; never store account or payment tokens. */
export function BrowsingContext() {
  useEffect(() => {
    const remember = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.target.closest('button')) return
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) return
      const destination = new URL(anchor.href, window.location.origin)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === '/size-guide' && window.location.pathname !== '/size-guide') {
        save(guideKey, { href: currentHref(), label: document.getElementById('purchase-options') ? 'Back to product' : 'Back to previous page' })
      }
      if (anchor.hasAttribute('data-product-link') && (document.getElementById('shop-products') || document.getElementById('category-products'))) {
        const label = document.querySelector('main h1')?.textContent?.trim() || 'collection'
        save(collectionKey, { href: currentHref(), label: `Back to ${label}`, destination: destination.pathname })
      }
    }
    document.addEventListener('click', remember, true)
    return () => document.removeEventListener('click', remember, true)
  }, [])
  return null
}

export function ReturnToCollectionLink({ fallbackHref, fallbackLabel }: { fallbackHref: string; fallbackLabel: string }) {
  const pathname = usePathname()
  const stored = useContext(collectionKey)
  const context = stored?.destination === pathname ? stored : { href: fallbackHref, label: fallbackLabel }
  return <Link href={context.href} className="mb-2 inline-flex min-h-11 max-w-full items-center gap-2 text-sm font-medium underline underline-offset-4"><ArrowLeft aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{context.label}</span></Link>
}

export function SizeGuideReturnLink() {
  const context = useContext(guideKey) || { href: '/shop', label: 'Back to shop' }
  return <Link href={context.href} className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"><ArrowLeft aria-hidden="true" className="size-4 shrink-0" />{context.label}</Link>
}
