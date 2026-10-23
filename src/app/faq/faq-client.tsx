"use client"

import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { Search, X, ArrowRight, Package, Truck, RotateCcw, CreditCard, UserCircle, ShieldCheck, Palette, ShoppingBag, Users, Ruler, Factory, Link2 } from 'lucide-react'
import { faqSectionId, type FaqCategory } from '@/lib/faq-page-data'
import { faqQuestionId, filterFaqCategories } from '@/lib/faq-search'
import { FaqText } from '@/components/faq-text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { WhatsAppButton } from '@/components/whatsapp-help'

const SECTION_ICONS: Record<string, React.ElementType> = {
  Orders: Package, Shipping: Truck, 'Returns & Exchanges': RotateCcw,
  Payments: CreditCard, Account: UserCircle, 'Privacy & Security': ShieldCheck,
  'Design & Customization': Palette, 'Jacket Sizing': Ruler,
  'Production & Delivery': Factory, 'Bulk & Team Orders': Users,
}
const shortcuts = [
  { title: 'Track an order', text: 'Check your order status', href: '/track-order', icon: Package },
  { title: 'Find your size', text: 'Measurements & fit guidance', href: '/size-guide', icon: Ruler },
  { title: 'Shipping information', text: 'Production, delivery & charges', href: '/shipping', icon: Truck },
  { title: 'Returns & exchanges', text: 'Eligibility & request steps', href: '/returns', icon: RotateCcw },
]

export default function FaqPage({ categories }: { categories: FaqCategory[] }) {
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('all')
  const [expanded, setExpanded] = useState<string[]>([])
  const topics = useMemo(() => categories.filter(category => category.items.length > 0), [categories])
  const searchCategories = useMemo(() => filterFaqCategories(topics, query), [topics, query])
  const visible = selected === 'all' ? searchCategories : searchCategories.filter(category => category.title === selected)
  const visibleIds = visible.flatMap(category => category.items.map(item => faqQuestionId(item.question)))
  const total = topics.reduce((count, category) => count + category.items.length, 0)
  const allExpanded = visibleIds.length > 0 && visibleIds.every(id => expanded.includes(id))
  const counts = new Map(searchCategories.map(category => [category.title, category.items.length]))

  function revealHash(hash: string) {
    let id: string
    try { id = decodeURIComponent(hash.replace(/^#/, '')) } catch { return }
    const item = topics.flatMap(category => category.items).find(faq => faqQuestionId(faq.question) === id)
    if (!item && !topics.some(category => faqSectionId(category.title) === id)) return
    setQuery('')
    setSelected('all')
    if (item) setExpanded(values => [...new Set([...values, id])])
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
  }
  useEffect(() => {
    const onHash = () => revealHash(window.location.hash)
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [topics])

  function handleInternalLink(event: MouseEvent<HTMLElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    const anchor = (event.target as Element).closest('a')
    if (!anchor) return
    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return
    event.preventDefault()
    window.history.pushState(null, '', url.hash)
    revealHash(url.hash)
  }
  function updateQuery(value: string) {
    setQuery(value)
    setSelected('all')
    setExpanded(value.trim() ? filterFaqCategories(topics, value).flatMap(category => category.items.map(item => faqQuestionId(item.question))) : [])
  }
  function reset() {
    setQuery('')
    setSelected('all')
    setExpanded([])
  }
  function toggleAll() {
    setExpanded(values => allExpanded ? values.filter(id => !visibleIds.includes(id)) : [...new Set([...values, ...visibleIds])])
  }

  return (
    <div className="category-page flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1" onClickCapture={handleInternalLink}>
        <section className="section-shell py-6! md:py-8!">
          <Breadcrumbs items={[{ label: 'FAQ' }]} className="mb-5" />
          <div className="rounded-2xl bg-[#242b30] p-6 text-white sm:p-9 lg:p-11">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Jacketee help center</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Frequently Asked Questions</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">From your first jacket design to delivery day. Find answers about customization, sizing, orders, shipping and returns.</p>
            <form role="search" aria-label="Search frequently asked questions" className="mt-6 max-w-2xl" onSubmit={event => { event.preventDefault(); document.getElementById('faq-results')?.scrollIntoView({ block: 'start' }) }}>
              <label htmlFor={searchId} className="mb-2 block text-sm font-medium">Search our FAQs</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground" /><input ref={searchRef} id={searchId} type="search" value={query} onChange={event => updateQuery(event.target.value)} aria-controls="faq-results" placeholder="Try shipping, sizing or embroidery" className="min-h-14 w-full rounded-lg border border-transparent bg-background pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-search-cancel-button]:appearance-none" />{query && <button type="button" aria-label="Clear search" onClick={() => { updateQuery(''); searchRef.current?.focus() }} className="absolute right-1 top-1 flex h-12 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X aria-hidden="true" className="h-4 w-4" /></button>}</div>
                <button type="submit" className="inline-flex min-h-14 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-white/90">Search</button>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/60">Search questions and answers across all topics. No order or account details needed.</p>
            </form>
          </div>
        </section>

        <section className="section-shell pb-7! pt-0! md:pb-10!" aria-label="Quick help links">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{shortcuts.map(({ icon: Icon, title, text, href }) => <Link key={href} href={href} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary sm:p-5"><Icon aria-hidden="true" className="h-5 w-5 text-primary" /><h2 className="mt-3 text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p><span className="mt-3 flex min-h-8 items-center gap-2 text-xs font-semibold text-primary">View guide<ArrowRight aria-hidden="true" className="h-3 w-3" /></span></Link>)}</div>
        </section>

        <section className="section-shell grid items-start gap-7 pb-10! pt-0! lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 md:pb-14!">
          <aside className="hidden lg:block"><div className="sticky top-24"><h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Browse topics</h2><nav aria-label="FAQ topics" className="mt-3 max-h-[calc(100dvh-15rem)] space-y-1 overflow-y-auto pr-2"><button type="button" aria-pressed={selected === 'all'} onClick={() => setSelected('all')} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm ${selected === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted'}`}><span>All topics</span><span className="text-xs">{searchCategories.reduce((count, category) => count + category.items.length, 0)}</span></button>{topics.map(category => { const Icon = SECTION_ICONS[category.title] || ShoppingBag; return <button key={category.title} type="button" aria-pressed={selected === category.title} onClick={() => setSelected(category.title)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm ${selected === category.title ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span className="flex items-center gap-2"><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{category.title}</span><span className="text-xs">{counts.get(category.title) || 0}</span></button> })}</nav><Link href="/contact" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Ask the team<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div></aside>
          <div className="min-w-0">
            <div className="mb-5 lg:hidden"><label htmlFor={`${searchId}-topic`} className="mb-2 block text-sm font-semibold">Browse by topic</label><select id={`${searchId}-topic`} value={selected} onChange={event => setSelected(event.target.value)} className="min-h-12 w-full rounded-lg border bg-background px-3 text-base"><option value="all">All topics</option>{topics.map(category => <option key={category.title} value={category.title}>{category.title} ({counts.get(category.title) || 0})</option>)}</select></div>
            <div id="faq-results" className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"><div><h2 className="text-xl font-semibold tracking-tight">{query.trim() ? 'Search results' : selected === 'all' ? 'Browse all answers' : selected}</h2><p role="status" className="mt-1 text-xs leading-5 text-muted-foreground">{visibleIds.length} {visibleIds.length === 1 ? 'answer' : 'answers'}{query.trim() ? ` for “${query.trim()}”` : ` of ${total}`}{selected !== 'all' ? ` in ${selected}` : ''}</p></div><div className="flex flex-wrap gap-x-5 gap-y-1">{(query || selected !== 'all') && <button type="button" onClick={reset} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Clear filters</button>}{visibleIds.length > 0 && <button type="button" onClick={toggleAll} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{allExpanded ? 'Collapse all' : 'Expand all'}</button>}</div></div>
              {visibleIds.length === 0 ? <div className="rounded-2xl border border-dashed bg-muted/20 p-6 sm:p-8"><h3 className="text-lg font-semibold">No matching answers yet.</h3><p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">Try a shorter phrase such as “shipping”, “size” or “design”, or clear the topic filter to search more answers.</p><div className="mt-5 flex flex-wrap gap-4"><button type="button" onClick={() => { reset(); searchRef.current?.focus() }} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Show all answers</button><Link href="/contact" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Contact the team</Link></div></div> : <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="space-y-7">{visible.map(category => { const Icon = SECTION_ICONS[category.title] || ShoppingBag; return <section key={category.title} id={faqSectionId(category.title)} aria-labelledby={`${faqSectionId(category.title)}-heading`} className="scroll-mt-24"><h2 id={`${faqSectionId(category.title)}-heading`} className="mb-3 flex items-center gap-3 text-lg font-semibold"><Icon aria-hidden="true" className="h-5 w-5 text-primary" />{category.title}<span className="text-xs font-normal text-muted-foreground">{category.items.length}</span></h2><div className="rounded-xl border bg-card px-4 sm:px-6">{category.items.map(item => { const id = faqQuestionId(item.question); const paragraphs = Array.isArray(item.answer) ? item.answer : [item.answer]; return <AccordionItem key={id} id={id} value={id} className="scroll-mt-24"><AccordionTrigger className="min-h-14 items-center text-left text-sm font-semibold sm:text-base">{item.question}</AccordionTrigger><AccordionContent className="space-y-3 text-sm leading-7 text-muted-foreground">{paragraphs.map((text, index) => <p key={index}><FaqText text={text} /></p>)}{item.bullets && item.bullets.length > 0 && <ul className="list-disc space-y-2 pl-5">{item.bullets.map((text, index) => <li key={index}><FaqText text={text} /></li>)}</ul>}{item.ordered && item.ordered.length > 0 && <ol className="list-decimal space-y-2 pl-5">{item.ordered.map((text, index) => <li key={index}><FaqText text={text} /></li>)}</ol>}<a href={`#${id}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-medium underline underline-offset-4"><Link2 aria-hidden="true" className="h-3 w-3" />Link to this answer</a></AccordionContent></AccordionItem> })}</div></section> })}</Accordion>}
              {visibleIds.length > 12 && <div className="mt-5 flex justify-end"><button type="button" onClick={toggleAll} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{allExpanded ? 'Collapse all answers' : 'Expand all answers'}</button></div>}
            </div>
          </div>
        </section>

        <section className="section-shell pb-10! pt-0! md:pb-14!"><div className="grid gap-5 rounded-2xl bg-[#242b30] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-white/60">A little help goes a long way</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">Still have a question?</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/75">Tell us what you’re planning, or share your order number if you’ve already ordered. The Jacketee team can help with your next step.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950">Contact the team<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><WhatsAppButton message="I have a question after reading the Jacketee FAQs. Can you help me with my jacket or order?" /></div></div></section>
      </main>
      <Footer />
    </div>
  )
}
