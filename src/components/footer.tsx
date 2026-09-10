'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildCategoryUrl } from '@/lib/categories'
import { openCookiePreferences } from '@/lib/cookie-consent'
import { getStaticCategories } from '@/lib/static-data'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

interface FooterLink {
  href: string
  label: string
  id?: string
}

const customerCareLinks: FooterLink[] = [
  { href: '/shop', label: 'Shop All' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/materials-colors', label: 'Materials & Colors' },
  { href: '/patches-embroidery', label: 'Patches & Embroidery' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/shipping', label: 'Shipping Info' },
  { href: '/track-order', label: 'Track Your Order' },
  { href: '/returns', label: 'Returns & Exchanges' },
  { href: '/returns#request-form', label: 'Submit Return Request' },
]

const legalLinks: FooterLink[] = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/contact', label: 'Support' },
]

export function Footer() {
  const [categories, setCategories] = useState<Category[]>(() => getStaticCategories())
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : getStaticCategories()))
      .then((data) => {
        if (isMounted) setCategories(data)
      })
      .catch(() => {
        if (isMounted) setCategories(getStaticCategories())
      })

    return () => {
      isMounted = false
    }
  }, [])

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

  const categoryLinks: FooterLink[] = categories
    .filter((category) => !category.parentId)
    .slice(0, 5)
    .map((category) => ({
      href: buildCategoryUrl([category]),
      label: category.name,
      id: category.id,
    }))

  const renderLinkList = (links: FooterLink[]) => (
    <div className="flex flex-col gap-3">
      {links.map((link) => (
        <Link
          key={link.id || link.href}
          href={link.href}
          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary md:hover:translate-x-0.5"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )

  const newsletterForm = (
    <form onSubmit={handleSubscribe} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 w-full bg-background text-sm"
        required
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full shrink-0 gap-2 px-4 sm:w-auto md:w-11 md:px-0"
        aria-label="Subscribe to newsletter"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span className="md:sr-only">Subscribe</span>
          </>
        )}
      </Button>
    </form>
  )

  return (
    <footer className="mt-auto border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 pb-24 pt-10 md:pb-16 md:pt-14">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr_1fr_1fr] md:gap-12">
          <div className="space-y-4 md:max-w-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-xl font-bold text-transparent">
                Jacketee
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Custom jackets, patches, embroidery, and team apparel made for standout everyday wear.
            </p>
          </div>

          <div className="space-y-3 md:order-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Stay Updated</h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Get custom jacket updates, subscriber offers, and design guides.
            </p>
            {newsletterForm}
          </div>

          <div className="hidden space-y-4 md:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Categories</h3>
            {renderLinkList(categoryLinks)}
          </div>

          <div className="hidden space-y-4 md:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Customer Care</h3>
            {renderLinkList(customerCareLinks)}
          </div>

          <Accordion type="multiple" className="border-y md:hidden">
            <AccordionItem value="categories">
              <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider hover:no-underline">
                Categories
              </AccordionTrigger>
              <AccordionContent>{renderLinkList(categoryLinks)}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider hover:no-underline">
                Customer Care
              </AccordionTrigger>
              <AccordionContent>{renderLinkList(customerCareLinks)}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="legal">
              <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider hover:no-underline">
                Legal
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {renderLinkList(legalLinks)}
                  <button
                    type="button"
                    onClick={() => openCookiePreferences()}
                    className="text-left text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                  >
                    Cookie Preferences
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="mt-8 border-t border-muted pt-6 text-xs text-muted-foreground md:mt-12 md:text-center">
          <div className="hidden flex-wrap justify-center gap-x-5 gap-y-2 md:flex">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="underline-offset-2 transition-colors hover:text-primary hover:underline"
            >
              Cookie Preferences
            </button>
          </div>
          <p className="leading-relaxed md:mt-4">
            (c) {new Date().getFullYear()} Jacketee. All rights reserved. Designed for excellence.
          </p>
        </div>
      </div>
    </footer>
  )
}
