'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartDrawer } from '@/components/cart-drawer'
import { ArrowRight, Building2, ChevronDown, GraduationCap, Heart, LayoutDashboard, Loader2, LogOut, Menu, Package, Ruler, Search, Tags, User, UserCheck, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { buildProductUrl } from '@/lib/categories'
import { BrandLogo } from '@/components/brand-logo'

interface NavLink {
  href: string
  label: string
  description: string
  icon?: React.ElementType
}

const varsitySubcategoryLinks: NavLink[] = [
  { href: '/varsity-jackets/wool-leather', label: 'Wool & Leather', description: 'Classic letterman body with leather sleeves' },
  { href: '/varsity-jackets/all-wool', label: 'All Wool', description: 'Warm wool body and sleeves' },
  { href: '/varsity-jackets/satin', label: 'Satin', description: 'Lightweight shiny team jacket style' },
  { href: '/varsity-jackets/faux-leather', label: 'Faux Leather', description: 'Leather look with vegan materials' },
  { href: '/varsity-jackets/all-leather', label: 'All Leather', description: 'Premium leather varsity builds' },
  { href: '/varsity-jackets/hooded', label: 'Hooded', description: 'Varsity style with everyday hood detail' },
  { href: '/varsity-jackets/retro', label: 'Retro', description: 'Vintage-inspired letterman looks' },
  { href: '/varsity-jackets/cotton-twill', label: 'Cotton Twill', description: 'Lightweight casual varsity fabric' },
]

const otherStyleLinks: NavLink[] = [
  { href: '/bomber-jackets', label: 'Bomber Jackets', description: 'MA-1, satin, and casual bomber styles' },
  { href: '/puffer-jackets', label: 'Puffer Jackets', description: 'Insulated outerwear for colder seasons' },
  { href: '/denim-jackets', label: 'Denim Jackets', description: 'Custom denim layers and streetwear looks' },
  { href: '/coach-jackets', label: 'Coach Jackets', description: 'Lightweight snap-front team jackets' },
  { href: '/fleece-hoodies', label: 'Fleece Hoodies', description: 'Soft fleece and hoodie-based apparel' },
  { href: '/leather-jackets', label: 'Leather Jackets', description: 'Premium leather and suede options' },
]

const bulkOrderLinks: NavLink[] = [
  { href: '/bulk-orders/schools', label: 'School Orders', description: 'Varsity jackets for schools, teams, and clubs', icon: GraduationCap },
  { href: '/bulk-orders/corporate', label: 'Corporate Office', description: 'Branded jackets for staff, events, and merch', icon: Building2 },
  { href: '/bulk-orders/private-label', label: 'Private Label', description: 'Custom production for brands and resellers', icon: Tags },
]

const supportLinks: NavLink[] = [
  { href: '/size-guide', label: 'Size Guide', description: 'Sizing help before you order', icon: Ruler },
  { href: '/track-order', label: 'Track Order', description: 'Check order status and delivery updates', icon: Package },
  { href: '/materials-colors', label: 'Materials', description: 'Compare fabrics, finishes, and color options' },
  { href: '/patches-embroidery', label: 'Patches', description: 'Plan chenille, embroidery, and placement' },
  { href: '/faq', label: 'FAQ', description: 'Quick answers for common questions' },
  { href: '/contact', label: 'Contact Us', description: 'Ask about orders, sizing, or custom work' },
]

interface SearchSuggestion {
  id: string
  name: string
  slug: string
  thumbnail: string
  price: number
  compareAtPrice: number | null
  categoryPath?: Array<{ name: string; slug: string }>
}

export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileMenuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (query.trim().length < 2) {
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search-autocomplete?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Autocomplete search failed:', error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setMobileSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (product: SearchSuggestion) => {
    setIsOpen(false)
    setMobileSearchOpen(false)
    setQuery('')
    setSuggestions([])
    router.push(buildProductUrl({ slug: product.slug, categoryPath: product.categoryPath }))
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
    } else {
      setIsSearching(true)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    setMobileSearchOpen(false)
    import('@/lib/activity').then(({ logUserActivity }) => {
      logUserActivity('search', { query: query.trim() })
    })
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
  }

  const showDropdown = (isOpen || mobileSearchOpen) && query.trim().length >= 2

  const renderMobileLink = (href: string, label: string, description?: string, itemKey = href) => (
    <Link
      key={itemKey}
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      className="group flex min-h-14 items-center justify-between gap-3 rounded-md border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )

  const renderMobileSection = (title: string, links: NavLink[]) => (
    <section className="space-y-2">
      <p className="px-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {links.map((link) => renderMobileLink(link.href, link.label, link.description, `${title}-${link.label}-${link.href}`))}
      </div>
    </section>
  )

  const renderDesktopMenuLink = (link: NavLink) => (
    <Link
      key={link.href}
      href={link.href}
      className="block rounded-sm px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {link.label}
    </Link>
  )

  const renderDesktopMenu = (
    label: string,
    links: NavLink[],
    allLink?: NavLink
  ) => (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>
      <div
        className="invisible absolute left-0 top-full z-50 w-56 pt-1 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <div className="rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
          {allLink && <div className="border-b pb-1 mb-1">{renderDesktopMenuLink(allLink)}</div>}
          {links.map(renderDesktopMenuLink)}
        </div>
      </div>
    </div>
  )

  const renderSuggestionsList = () => (
    <>
      {isSearching ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      ) : suggestions.length > 0 ? (
        <ul className="py-1">
          {suggestions.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => handleSelectSuggestion(product)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{product.name}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No products found for &ldquo;{query}&rdquo;
        </div>
      )}
    </>
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const isAuthenticated = status === 'authenticated' && !!session?.user

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="Jacketee home" className="block shrink-0">
              <BrandLogo priority />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {renderDesktopMenu('Varsity Jackets', varsitySubcategoryLinks, { href: '/varsity-jackets', label: 'All Varsity Jackets', description: '' })}
              {renderDesktopMenu('Other Styles', otherStyleLinks, { href: '/shop', label: 'Shop All', description: '' })}
              {renderDesktopMenu('Bulk Order', bulkOrderLinks, { href: '/bulk-orders', label: 'All Bulk Orders', description: '' })}
              {renderDesktopMenu('Support', supportLinks)}
            </nav>
          </div>

          <div ref={searchContainerRef} className="relative hidden flex-1 max-w-sm md:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="pl-9"
              />
            </form>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border bg-popover shadow-lg"
                >
                  {renderSuggestionsList()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <CartDrawer />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                        {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=wishlist" className="cursor-pointer w-full flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>My Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/track-order" className="cursor-pointer w-full flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Track an Order</span>
                    </Link>
                  </DropdownMenuItem>
                  {(session.user as any).role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer w-full flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button size="sm">Sign In</Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              ref={mobileSearchContainerRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mt-3 overflow-visible md:hidden"
            >
              <form onSubmit={handleSearchSubmit}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  autoFocus
                  className="pl-9"
                />
              </form>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border bg-popover shadow-lg">
                  {renderSuggestionsList()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[999] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/45"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute right-0 top-0 flex h-dvh w-[92vw] max-w-sm flex-col overflow-y-auto border-l bg-background shadow-2xl"
            >
              <div className="border-b bg-muted/30 p-5 pr-14">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} aria-label="Jacketee home" className="inline-block">
                  <BrandLogo className="h-10 w-[120px]" />
                </Link>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Varsity jackets, other styles, bulk orders, and support.
                </p>
                <Button asChild className="mt-4 h-11 w-full justify-between">
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                    Shop All Jackets
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {status === 'authenticated' && session?.user && (
                  <div className="mt-3 grid gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-md border bg-background px-3.5 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span>My Profile</span>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/profile?tab=wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-md border bg-background px-3.5 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span>My Wishlist</span>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-start px-3 text-destructive hover:text-destructive"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                )}
                {status !== 'authenticated' && (
                  <Button asChild className="mt-3 w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 space-y-6 p-4">
                {renderMobileSection('Varsity Jackets', [
                  { href: '/varsity-jackets', label: 'All Varsity Jackets', description: 'Classic custom letterman styles' },
                  ...varsitySubcategoryLinks,
                ])}
                {renderMobileSection('Other Styles', otherStyleLinks)}
                {renderMobileSection('Bulk Order', bulkOrderLinks)}
                {renderMobileSection('Support', supportLinks)}
              </div>

              <div className="border-t p-4">
                {status === 'authenticated' && session?.user ? (
                  <div className="space-y-2">
                    {(session.user as any).role === 'admin' && renderMobileLink('/admin/dashboard', 'Admin Dashboard')}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">Sign in to view your profile and wishlist.</p>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}
    </header>
  )
}
