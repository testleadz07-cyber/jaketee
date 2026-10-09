'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, PackageCheck, Truck, MapPin, ChevronDown, Pencil, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { deliverySettings, deliveryTooltip, returnPolicyText, shippingCountryOptions, shippingCountryError } from '@/config/fulfillment'
import { allCountries } from '@/config/shipping-countries'
import { estimateDelivery, formatDeliveryDate } from '@/lib/delivery-dates'

const COUNTRY_KEY = 'jacketee-delivery-country'
const validCountry = (value: string | null) => allCountries.some(country => country.code === value)

function PolicyTip({ label, children }: { label: string; children: React.ReactNode }) {
  return <Popover>
    <PopoverTrigger asChild><button type="button" aria-label={label} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"><Info className="size-4" /></button></PopoverTrigger>
    <PopoverContent className="max-w-[calc(100vw-2rem)] text-sm leading-6">{children}</PopoverContent>
  </Popover>
}

export function ProductDeliveryPolicies({ quantity }: { quantity: number }) {
  const id = useId()
  const [open, setOpen] = useState(true)
  const [dates, setDates] = useState<ReturnType<typeof estimateDelivery> | null>(null)
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [search, setSearch] = useState('')
  const manuallySelected = useRef(false)

  useEffect(() => {
    const update = () => setDates(estimateDelivery())
    const initialTimer = window.setTimeout(update, 0)
    const timer = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    const controller = new AbortController()
    let saved: string | null = null
    try { saved = localStorage.getItem(COUNTRY_KEY) } catch { /* Storage can be disabled. */ }
    const countryTimer = validCountry(saved) ? window.setTimeout(() => {
      if (!manuallySelected.current) setCountryCode(saved)
    }, 0) : undefined
    if (validCountry(saved)) { /* The saved preference takes priority over geolocation. */ }
    else void fetch('/api/visitor-country', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!manuallySelected.current && validCountry(data?.country)) setCountryCode(data.country) })
      .catch(() => { /* Allow manual selection when geolocation is unavailable. */ })
    return () => { clearTimeout(initialTimer); clearTimeout(countryTimer); clearInterval(timer); window.removeEventListener('focus', update); controller.abort() }
  }, [])

  const country = allCountries.find(item => item.code === countryCode)
  const countryError = country ? shippingCountryError(countryCode) : null
  // Excluded options remain visible so visitors can select one and see why it is unavailable.
  const options = [...shippingCountryOptions, ...allCountries.filter(item => shippingCountryError(item.code))]
    .sort((a, b) => a.name.localeCompare(b.name))
  const results = options.filter(item => `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase().trim()))
  const iconClass = 'mt-3 size-5 shrink-0 text-[#b99345]'

  return <section className="w-full rounded-lg border border-[#b99345]/45 bg-[#10243a] text-white">
    <h2><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold focus-visible:outline-2 focus-visible:outline-[#b99345]">
      Delivery and return policies<ChevronDown className={`size-5 shrink-0 text-[#d5b56b] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button></h2>
    <div id={id} hidden={!open} className="space-y-2 border-t border-white/15 px-4 pb-4 pt-2 text-sm leading-6">
      <div className="flex items-start gap-3"><CalendarDays className={iconClass} /><div className="min-w-0 flex-1 py-2">
        <p className="font-medium">Estimated delivery</p>
        <Popover><PopoverTrigger asChild><button type="button" className="min-h-11 text-left underline decoration-dashed underline-offset-4" aria-label="Estimated delivery details">
          {dates ? <>Order today to get by <strong>{formatDeliveryDate(dates.min)} – {formatDeliveryDate(dates.max)}</strong></> : <span role="status" aria-label="Calculating delivery dates" className="block h-5 w-52 max-w-full animate-pulse rounded bg-white/20" />}
        </button></PopoverTrigger><PopoverContent className="max-w-[calc(100vw-2rem)] text-sm leading-6">{deliveryTooltip}</PopoverContent></Popover>
      </div></div>
      <div className="flex items-start gap-3"><PackageCheck className={iconClass} /><div className="flex flex-1 flex-wrap items-center gap-x-1 py-1">
        <p><Link href="/returns" className="inline-flex min-h-11 items-center underline underline-offset-4">Returns &amp; exchanges accepted</Link> within {deliverySettings.returnDays} days</p>
        <PolicyTip label="Return eligibility and personalized item policy"><p>{returnPolicyText.eligibility}</p><p>{returnPolicyText.fee}</p><p>Non-returnable Items: {returnPolicyText.personalized}</p><p>{returnPolicyText.customExchange}</p><p>{returnPolicyText.faulty}</p></PolicyTip>
      </div></div>
      <div className="flex items-start gap-3"><Truck className={iconClass} /><div className="flex-1 py-2">
        {quantity < 2 ? <p>Shipping: ${deliverySettings.singleJacketShipping} USD</p> : <Link href="/contact#contact-form" className="inline-flex min-h-11 items-center underline underline-offset-4">Shipping quote required for 2+ jackets</Link>}
      </div></div>
      <div className="flex items-start gap-3"><MapPin className={iconClass} /><div className="min-w-0 flex-1">
        <Popover open={selectorOpen} onOpenChange={value => { setSelectorOpen(value); if (!value) setSearch('') }}><PopoverTrigger asChild><button type="button" className="flex min-h-11 items-center gap-2 text-left" aria-label="Change delivery country">Deliver to <strong>{country?.name || 'Select country'}</strong><Pencil className="size-4 text-[#d5b56b]" /></button></PopoverTrigger>
          <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-2">
            <label htmlFor={`${id}-search`} className="px-2 text-sm font-medium">Search countries</label>
            <input id={`${id}-search`} value={search} onChange={event => setSearch(event.target.value)} placeholder="Country name or code" className="mt-1 min-h-11 w-full rounded border px-3 text-sm" />
            <div className="mt-2 max-h-64 overflow-y-auto" aria-label="Delivery countries">
              {results.map(item => <button key={item.code} type="button" aria-pressed={item.code === countryCode} className="block min-h-11 w-full rounded px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted" onClick={() => {
                manuallySelected.current = true
                setCountryCode(item.code)
                try { localStorage.setItem(COUNTRY_KEY, item.code) } catch { /* Keep selection in memory. */ }
                setSelectorOpen(false); setSearch('')
              }}>{item.name}{shippingCountryError(item.code) ? ' (shipping unavailable)' : ''}</button>)}
              {!results.length && <p className="p-3 text-sm">No countries found.</p>}
            </div>
          </PopoverContent>
        </Popover>
        {countryError && <p role="status" className="pb-2 text-[#f1d99f]">{countryError} <Link href="/contact" className="inline-flex min-h-11 items-center underline">Contact us</Link></p>}
      </div></div>
    </div>
  </section>
}
