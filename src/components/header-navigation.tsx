'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { varsitySubcategoryLinks, otherStyleLinks, customJacketLinks, bulkOrderLinks, supportLinks, type NavLink } from '@/data/header-navigation'

const groups = [
  { label: 'Varsity Jackets', href: '/varsity-jackets', links: varsitySubcategoryLinks, all: 'Shop all varsity jackets' },
  { label: 'Bombers & More', href: '/shop', links: otherStyleLinks, all: 'Shop all styles' },
  { label: 'Build Your Jacket', href: '/design/varsity', links: customJacketLinks, all: 'Start with a varsity jacket' },
  { label: 'Bulk & Teams', href: '/bulk-orders', links: bulkOrderLinks, all: 'Explore all group orders' },
]

function NavGroup({ label, links, href, all, alignRight = false }: { label: string; links: NavLink[]; href: string; all: string; alignRight?: boolean }) {
  const pathname = usePathname()
  return <NavigationMenu.Item className="relative">
    <NavigationMenu.Trigger className={`group flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-accent xl:px-4 ${label === 'Build Your Jacket' ? 'text-primary' : ''}`}>
      {label}<svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </NavigationMenu.Trigger>
    <NavigationMenu.Content className={`absolute top-full z-[65] w-[min(32rem,calc(100vw-2rem))] rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl ${alignRight ? 'right-0' : 'left-0'}`}>
      <NavigationMenu.Link asChild active={pathname === href}><Link href={href} className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 text-sm font-semibold text-primary hover:bg-accent">{all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></NavigationMenu.Link>
      <ul className="mt-2 grid grid-cols-2 gap-1">{links.map(link => <li key={link.href}><NavigationMenu.Link asChild active={pathname === link.href}><Link href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className="block min-h-16 rounded-lg p-3 hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><span className="block text-sm font-semibold">{link.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.description}</span></Link></NavigationMenu.Link></li>)}</ul>
    </NavigationMenu.Content>
  </NavigationMenu.Item>
}

export function DesktopHeaderNavigation() {
  const pathname = usePathname()
  return <NavigationMenu.Root aria-label="Main navigation" delayDuration={350} skipDelayDuration={200} className="hidden border-t lg:block">
    <NavigationMenu.List className="container mx-auto flex list-none items-center gap-1 px-4 py-1">
      <NavigationMenu.Item><NavigationMenu.Link asChild active={pathname === '/shop'}><Link href="/shop" aria-current={pathname === '/shop' ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring xl:px-4">Shop All</Link></NavigationMenu.Link></NavigationMenu.Item>
      {groups.map((group, index) => <NavGroup key={group.label} {...group} alignRight={index === groups.length - 1} />)}
      <NavigationMenu.Item><NavigationMenu.Link asChild active={pathname === '/patches-embroidery'}><Link href="/patches-embroidery" aria-current={pathname === '/patches-embroidery' ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring xl:px-4">Patches &amp; Embroidery</Link></NavigationMenu.Link></NavigationMenu.Item>
    </NavigationMenu.List>
  </NavigationMenu.Root>
}

export function HeaderSupportMenu() {
  return <NavigationMenu.Root aria-label="Support navigation" delayDuration={350} className="hidden lg:block"><NavigationMenu.List><NavGroup label="Support" links={supportLinks} href="/faq" all="Visit the help center" alignRight /></NavigationMenu.List></NavigationMenu.Root>
}

export function MobileHeaderNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  return <nav aria-label="Mobile main navigation" className="px-4 pb-4">
    <Link href="/shop" onClick={onNavigate} className="flex min-h-12 items-center justify-between rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Shop All<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    <Accordion type="multiple" className="mt-3">{[...groups, { label: 'Support', href: '/faq', links: supportLinks, all: 'Visit the help center' }].map(group => <AccordionItem key={group.label} value={group.label}><AccordionTrigger className={`min-h-13 px-2 text-left text-base font-semibold hover:no-underline ${group.label === 'Build Your Jacket' ? 'text-primary' : ''}`}>{group.label}</AccordionTrigger><AccordionContent className="pb-3"><ul><li><Link href={group.href} onClick={onNavigate} className="flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-accent">{group.all}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></li>{group.links.map(link => <li key={link.href}><Link href={link.href} onClick={onNavigate} aria-current={pathname === link.href ? 'page' : undefined} className="flex min-h-11 items-center rounded-lg px-4 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{link.label}</Link></li>)}</ul></AccordionContent></AccordionItem>)}</Accordion>
    <Link href="/patches-embroidery" onClick={onNavigate} className="flex min-h-12 items-center justify-between border-b px-2 text-base font-semibold">Patches &amp; Embroidery<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
  </nav>
}
