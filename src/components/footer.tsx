'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Factory, Loader2, LockKeyhole, RotateCcw, Send, Star } from 'lucide-react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildCategoryUrl } from '@/lib/categories'
import { openCookiePreferences } from '@/lib/cookie-consent'
import { getStaticCategories } from '@/lib/static-data'
import { useToast } from '@/hooks/use-toast'
import { BrandLogo } from '@/components/brand-logo'

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
  { href: '/about', label: 'About Jacketee' },
  { href: '/shop', label: 'Shop All' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/size-guide', label: 'Size Guide' },
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

const customJacketLinks: FooterLink[] = [
  { href: '/custom-letterman-jackets', label: 'Custom Letterman Jackets' },
  { href: '/custom-bomber-jackets', label: 'Custom Bomber Jackets' },
  { href: '/custom-coach-jackets', label: 'Custom Coach Jackets' },
  { href: '/custom-denim-jackets', label: 'Custom Denim Jackets' },
  { href: '/custom-puffer-jackets', label: 'Custom Puffer Jackets' },
  { href: '/custom-hoodies', label: 'Custom Hoodies' },
  { href: '/varsity-jackets/oversized', label: 'Oversized Varsity Jackets' },
  { href: '/varsity-jackets/vintage', label: 'Vintage Varsity Jackets' },
  { href: '/bulk-orders/senior-class', label: 'Senior Class Jackets' },
  { href: '/bulk-orders/sorority-fraternity', label: 'Sorority & Fraternity Jackets' },
  { href: '/bulk-orders/cheer', label: 'Custom Cheer Jackets' },
]

export function Footer() {
  const [categories, setCategories] = useState<Category[]>(() => getStaticCategories())
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvedReviewCount, setApprovedReviewCount] = useState<number | null>(null)
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

  useEffect(() => {
    let isMounted = true

    fetch('/api/reviews/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && typeof data?.approvedReviewCount === 'number') {
          setApprovedReviewCount(data.approvedReviewCount)
        }
      })
      .catch(() => undefined)

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
      <div className="border-b bg-background">
        <div className="container mx-auto grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          <Link href="/checkout" className="flex min-h-24 items-center gap-3 bg-background px-4 py-5">
            <LockKeyhole className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">Secure checkout</strong><span className="text-xs text-muted-foreground">Protected payment flow</span></span>
          </Link>
          <Link href="/returns" className="flex min-h-24 items-center gap-3 bg-background px-4 py-5">
            <RotateCcw className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">Eligible returns</strong><span className="text-xs text-muted-foreground">10-day request window</span></span>
          </Link>
          <Link href="/about" className="flex min-h-24 items-center gap-3 bg-background px-4 py-5">
            <Factory className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">In-house production</strong><span className="text-xs text-muted-foreground">Made in our Sialkot factory</span></span>
          </Link>
          <Link href="/shop" className="flex min-h-24 items-center gap-3 bg-background px-4 py-5">
            {approvedReviewCount && approvedReviewCount > 0 ? <BadgeCheck className="h-5 w-5 shrink-0" /> : <Star className="h-5 w-5 shrink-0" />}
            <span>
              <strong className="block text-sm">Customer reviews</strong>
              <span className="text-xs text-muted-foreground">{approvedReviewCount === null ? 'Moderated customer feedback' : approvedReviewCount > 0 ? `${approvedReviewCount} approved ${approvedReviewCount === 1 ? 'review' : 'reviews'}` : 'Be the first to review'}</span>
            </span>
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-24 pt-10 md:pb-16 md:pt-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-4 md:max-w-xs">
            <Link href="/" aria-label="Jacketee home" className="inline-block"><BrandLogo /></Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Custom jackets, patches, embroidery, and team apparel made for standout everyday wear.
            </p>
          </div>

          <div className="space-y-3 lg:order-5">
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

          <div className="hidden space-y-4 md:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Custom Jackets</h3>
            {renderLinkList(customJacketLinks)}
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
            <AccordionItem value="custom-jackets">
              <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider hover:no-underline">
                Custom Jackets
              </AccordionTrigger>
              <AccordionContent>{renderLinkList(customJacketLinks)}</AccordionContent>
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
