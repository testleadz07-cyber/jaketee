'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartDrawer } from '@/components/cart-drawer'
import { ArrowRight, ChevronDown, Heart, LayoutDashboard, Loader2, LogOut, Menu, Package, Search, ShoppingBag, User, UserCheck, X } from 'lucide-react'
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

const shopLinks = [
  { href: '/shop', label: 'Shop All', description: 'Browse the full Jacketee catalog' },
  { href: '/varsity-jackets', label: 'Varsity Jackets', description: 'Classic letterman styles' },
  { href: '/bomber-jackets', label: 'Bomber Jackets', description: 'MA-1 and satin bomber styles' },
  { href: '/leather-jackets', label: 'Leather Jackets', description: 'Premium leather and suede' },
  { href: '/puffer-jackets', label: 'Puffer Jackets', description: 'Insulated outerwear' },
]

const guideLinks = [
  { href: '/materials-colors', label: 'Materials & Colors', description: 'Compare fabrics, finishes, and colors' },
  { href: '/patches-embroidery', label: 'Patches & Embroidery', description: 'Plan lettering, patches, and placement' },
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

  const renderMobileLink = (href: string, label: string, description?: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      className="group flex min-h-14 items-center justify-between gap-3 rounded-md border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )

  const renderMobileSection = (title: string, links: typeof shopLinks) => (
    <section className="space-y-2">
      <p className="px-1 text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <div className="space-y-2">{links.map((link) => renderMobileLink(link.href, link.label, link.description))}</div>
    </section>
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
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <ShoppingBag className="h-8 w-8 text-primary" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Jacketee
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 px-3">
                    Shop
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[560px] p-3">
                  <div className="grid grid-cols-[1fr_0.85fr] gap-3">
                    <div>
                      <DropdownMenuLabel className="px-2 text-xs uppercase text-muted-foreground">
                        Shop Jackets
                      </DropdownMenuLabel>
                      {shopLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild className="cursor-pointer p-0">
                          <Link href={link.href} className="block rounded-md px-3 py-2">
                            <span className="block text-sm font-medium">{link.label}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{link.description}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="border-l pl-3">
                      <DropdownMenuLabel className="px-2 text-xs uppercase text-muted-foreground">
                        Custom Guides
                      </DropdownMenuLabel>
                      {guideLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild className="cursor-pointer p-0">
                          <Link href={link.href} className="block rounded-md px-3 py-2">
                            <span className="block text-sm font-medium">{link.label}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{link.description}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/materials-colors" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                Materials
              </Link>
              <Link href="/patches-embroidery" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                Custom Options
              </Link>
              <Link href="/contact" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                Contact
              </Link>
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
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <span>Jacketee</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Custom jackets, materials, patches, and order support.
                </p>
                <Button asChild className="mt-4 h-11 w-full justify-between">
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                    Shop All Jackets
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
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
                {renderMobileSection('Shop Jackets', shopLinks.slice(1))}
                {renderMobileSection('Custom Guides', guideLinks)}
                {renderMobileSection('Help', [
                  { href: '/contact', label: 'Contact Us', description: 'Ask about sizing, materials, or custom work' },
                  { href: '/track-order', label: 'Track Order', description: 'Check your order status' },
                  { href: '/faq', label: 'FAQ', description: 'Quick answers before you order' },
                ])}
              </div>

              <div className="border-t p-4">
                {status === 'authenticated' && session?.user ? (
                  <div className="space-y-2">
                    {renderMobileLink('/profile', 'My Profile', session.user.email || undefined)}
                    {renderMobileLink('/profile?tab=wishlist', 'My Wishlist')}
                    {(session.user as any).role === 'admin' && renderMobileLink('/admin/dashboard', 'Admin Dashboard')}
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 text-destructive hover:text-destructive"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
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
