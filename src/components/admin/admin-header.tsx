'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/admin/notification-bell'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Guest Activity', href: '/admin/guest-activity' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Subscribers', href: '/admin/subscribers' },
  { label: 'Contact Messages', href: '/admin/contact-messages' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Discounts', href: '/admin/discounts' },
  { label: 'Bulk Editor', href: '/admin/bulk-editor' },
  { label: 'Tags', href: '/admin/tags' },
  { label: 'Refunds', href: '/admin/refunds' },
  { label: 'Blog', href: '/admin/blog' },
  { label: 'FAQs', href: '/admin/faqs' },
  { label: 'Analytics', href: '/admin/analytics' },
]

export function AdminHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 bg-background border-b shadow-sm">
      {/* Top Main Bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" title="Return to Storefront">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold tracking-tight">Jacketee Admin</h1>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <NotificationBell />
              {session?.user?.email && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Logged in as <span className="font-semibold text-foreground">{session.user.email}</span>
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Navigation Tabs */}
      <nav className="bg-background py-2">
        <div className="container mx-auto px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={isActive ? 'font-semibold bg-muted' : ''}
                >
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
