'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Heart, LayoutDashboard, LogOut, Menu, Package, User } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { CartDrawer } from '@/components/cart-drawer'
import { HeaderSearch } from '@/components/header-search'
import { DesktopHeaderNavigation, HeaderSupportMenu, MobileHeaderNavigation } from '@/components/header-navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Keep the optional prop compatible with existing storefront callers.
export function Header(_props: { home?: boolean } = {}) {
  const headerRef = useRef<HTMLElement>(null)
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = status === 'authenticated' ? session?.user : undefined
  const isAdmin = user && (user as { role?: string }).role === 'admin'
  const closeMenu = () => setMobileMenuOpen(false)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const updateHeight = () => document.documentElement.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`)
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => { if (desktop.matches) setMobileMenuOpen(false) }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  return <header ref={headerRef} className="sticky top-0 z-50 border-b bg-background text-foreground shadow-sm">
    <div className="container mx-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8 lg:py-3">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation menu" className="h-11 w-11 lg:hidden"><Menu aria-hidden="true" className="h-5 w-5" /></Button></SheetTrigger>
        <SheetContent side="left" className="h-dvh w-[min(92vw,25rem)] gap-0 overflow-y-auto overscroll-contain bg-background text-foreground sm:max-w-md [&>[data-slot=sheet-close]]:h-11 [&>[data-slot=sheet-close]]:w-11 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center">
          <SheetHeader className="border-b p-5 pr-16"><SheetTitle>Explore Jacketee</SheetTitle><SheetDescription>Find your style, build your jacket or get help.</SheetDescription></SheetHeader>
          <div className="pt-4"><MobileHeaderNavigation onNavigate={closeMenu} /></div>
          <div className="mt-auto space-y-3 border-t bg-muted/20 p-5">
            {user ? <><p className="truncate text-sm font-semibold">Hello, {user.name || 'there'}</p><div className="grid grid-cols-2 gap-2"><Button asChild variant="outline" className="min-h-11"><Link href="/profile" onClick={closeMenu}>My account</Link></Button><Button asChild variant="outline" className="min-h-11"><Link href="/profile?tab=wishlist" onClick={closeMenu}>Wishlist</Link></Button></div>{isAdmin && <Link href="/admin/dashboard" onClick={closeMenu} className="flex min-h-11 items-center text-sm">Admin dashboard</Link>}<Button variant="ghost" className="min-h-11 px-0 text-destructive" onClick={() => { closeMenu(); void signOut({ callbackUrl: '/' }) }}>Sign out</Button></> : <Button asChild variant="outline" className="min-h-11 w-full"><Link href="/login" onClick={closeMenu}>Sign in / Create account</Link></Button>}
            <div className="flex items-center justify-between border-t pt-3 [&_button]:h-11 [&_button]:w-11"><span className="text-sm text-muted-foreground">Appearance</span><ThemeToggle /></div>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/" aria-label="Jacketee home" className="w-fit min-w-0 justify-self-center md:justify-self-start"><BrandLogo priority className="h-10 w-28 sm:h-12 sm:w-36" /></Link>
      <HeaderSearch className="col-span-3 row-start-2 pb-1 md:col-span-1 md:col-start-3 md:row-start-1 md:pb-0 lg:col-start-2" />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:col-start-4 lg:col-start-3">
        <HeaderSupportMenu />
        <div className="hidden md:block [&_button]:h-11 [&_button]:w-11"><ThemeToggle /></div>
        {user ? <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Open account menu" className="h-11 w-11"><User aria-hidden="true" className="h-5 w-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} className="z-[60] w-60 max-w-[calc(100vw-1.5rem)]"><DropdownMenuLabel><p className="truncate">{user.name || 'Your account'}</p><p className="mt-1 truncate text-xs font-normal text-muted-foreground">{user.email}</p></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/profile" className="min-h-11"><User className="mr-2 h-4 w-4" />My account</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/profile?tab=wishlist" className="min-h-11"><Heart className="mr-2 h-4 w-4" />Wishlist</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/track-order" className="min-h-11"><Package className="mr-2 h-4 w-4" />Track an order</Link></DropdownMenuItem>{isAdmin && <DropdownMenuItem asChild><Link href="/admin/dashboard" className="min-h-11"><LayoutDashboard className="mr-2 h-4 w-4" />Admin dashboard</Link></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={() => { void signOut({ callbackUrl: '/' }) }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : <Button asChild variant="ghost" size="icon" className="h-11 w-11" aria-label="Sign in or create an account"><Link href="/login"><User aria-hidden="true" className="h-5 w-5" /></Link></Button>}
        <CartDrawer />
      </div>
    </div>
    <DesktopHeaderNavigation />
  </header>
}
