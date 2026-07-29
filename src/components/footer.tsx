'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getStaticCategories } from '@/lib/static-data'
import { openCookiePreferences } from '@/lib/cookie-consent'
import { buildCategoryUrl } from '@/lib/categories'

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([])
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      } else {
        setCategories(getStaticCategories())
      }
    } catch {
      setCategories(getStaticCategories())
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Subscription Successful!',
          description: data.message || 'Thank you for subscribing to our newsletter.',
        })
        setEmail('')
      } else {
        toast({
          title: 'Subscription Failed',
          description: data.error || 'Something went wrong.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to communicate with server.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="border-t bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 sm:grid-cols-2">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                LUXE STORE
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your destination for premium fashion and activewear. Elegant design meets top tier quality.
            </p>
          </div>

          {/* Categories Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Categories</h3>
            <div className="flex flex-col gap-2.5">
              {categories.filter((category) => !category.parentId).slice(0, 5).map((category) => (
                <Link
                  key={category.id}
                  href={buildCategoryUrl([category])}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Customer Care</h3>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Contact Us
              </Link>
              <Link
                href="/shipping"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Shipping Info
              </Link>
              <Link
                href="/track-order"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Track Your Order
              </Link>
              <Link
                href="/returns"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Returns & Exchanges
              </Link>
              <Link
                href="/returns#request-form"
                className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-0.5 duration-200"
              >
                Submit Return Request
              </Link>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border-muted hover:border-primary/50 focus-visible:ring-primary h-10 pr-4"
                  required
                />
              </div>
              <Button type="submit" size="icon" disabled={isSubmitting} className="h-10 w-10 shrink-0">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 pt-8 border-t border-muted text-center text-xs text-muted-foreground space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/cookie-policy" className="hover:text-primary transition-colors">
              Cookie Policy
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="hover:text-primary transition-colors underline-offset-2 hover:underline"
            >
              Cookie Preferences
            </button>
            <span>•</span>
            <Link href="/login" className="hover:text-primary transition-colors">
              Admin Panel
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Luxe Store. All rights reserved. Designed for excellence.</p>
        </div>
      </div>
    </footer>
  )
}
