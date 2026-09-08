'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const adminLinks = [
  ['Dashboard', '/admin/dashboard'],
  ['Products', '/admin/products'],
  ['Categories', '/admin/categories'],
  ['Orders', '/admin/orders'],
  ['Guest Activity', '/admin/guest-activity'],
  ['Notifications', '/admin/notifications'],
  ['Subscribers', '/admin/subscribers'],
  ['Contact Messages', '/admin/contact-messages'],
  ['Discounts', '/admin/discounts'],
  ['Bulk Editor', '/admin/bulk-editor'],
  ['Tags', '/admin/tags'],
  ['Refunds', '/admin/refunds'],
  ['Blog', '/admin/blog'],
] as const

export function AdminLoadingShell({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-muted/10">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="text-2xl font-bold tracking-tight">
              Jacketee Admin
            </Link>
            <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </header>
      <nav className="sticky top-[73px] z-10 overflow-x-auto border-b bg-background py-2">
        <div className="container mx-auto flex gap-2 px-4">
          {adminLinks.map(([name, href]) => (
            <Link key={href} href={href}>
              <Button variant="ghost" size="sm">{name}</Button>
            </Link>
          ))}
        </div>
      </nav>
      <main className="container mx-auto flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-8">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">{label}</p>
        </div>
      </main>
    </div>
  )
}