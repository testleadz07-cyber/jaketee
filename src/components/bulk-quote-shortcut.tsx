'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function BulkQuoteShortcut() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const hero = document.getElementById('bulk-hero')
    const quote = document.getElementById('bulk-quote')
    const footer = document.querySelector('footer')
    if (!hero || !quote || !footer) return
    const intersections = new Map<Element, boolean>([[hero, true], [quote, false], [footer, false]])
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => intersections.set(entry.target, entry.isIntersecting))
      setVisible(!intersections.get(hero) && !intersections.get(quote) && !intersections.get(footer))
    })
    ;[hero, quote, footer].forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  if (!visible) return null
  return <a href="#bulk-quote" className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 right-24 z-40 flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden">Request a quote<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
}
