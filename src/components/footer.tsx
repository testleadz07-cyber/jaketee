'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Factory, LockKeyhole, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaPinterestP, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import dynamic from 'next/dynamic'
const NewsletterForm = dynamic(() => import('@/components/newsletter-form').then((mod) => mod.NewsletterForm))
import { buildCategoryUrl } from '@/lib/categories'
import { openCookiePreferences } from '@/lib/cookie-consent'
import { getStaticCategories } from '@/lib/static-data'
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
  { href: '/how-to-customize', label: 'How to Customize' },
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
  { href: '/design/varsity', label: 'Build Your Varsity Jacket' },
  { href: '/design/bomber', label: 'Build Your Bomber Jacket' },
  { href: '/design/coach', label: 'Build Your Coach Jacket' },
  { href: '/design/puffer', label: 'Build Your Puffer Jacket' },
  { href: '/design/hoodie', label: 'Build Your Fleece Hoodie' },
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

const primaryCareLinks = customerCareLinks.filter(link =>
  ['/about', '/size-guide', '/contact', '/shipping', '/track-order', '/returns', '/faq'].includes(link.href)
)
const resourceLinks = customerCareLinks.filter(link => !primaryCareLinks.includes(link))
const designerLinks = customJacketLinks.filter(link => link.href.startsWith('/design/'))
const collectionLinks = customJacketLinks.filter(link => !link.href.startsWith('/design/'))
const primaryDesignerLinks = [
  ...designerLinks,
  { href: '/design', label: 'Explore all designers' },
  { href: '/bulk-orders', label: 'Bulk orders' },
]

const socialLinks = [
  {
    href: 'https://www.facebook.com/jacketeeofficial',
    label: 'Follow Jacketee on Facebook',
    icon: FaFacebookF,
  },
  {
    href: 'https://www.instagram.com/jacketeeofficial/',
    label: 'Follow Jacketee on Instagram',
    icon: FaInstagram,
  },
  {
    href: 'https://www.pinterest.com/ShopJacketee/',
    label: 'Follow Jacketee on Pinterest',
    icon: FaPinterestP,
  },
  {
    href: 'https://x.com/ShopJacketee',
    label: 'Follow Jacketee on X',
    icon: FaXTwitter,
  },
  {
    href: 'https://www.linkedin.com/in/info-jacketee-552187445/?isSelfProfile=true',
    label: 'Follow Jacketee on LinkedIn',
    icon: FaLinkedinIn,
  },
  {
    href: 'https://www.tiktok.com/@jacketeeofficial',
    label: 'Follow Jacketee on TikTok',
    icon: FaTiktok,
  },
  {
    href: 'https://www.youtube.com/@jacketeeofficial',
    label: 'Follow Jacketee on YouTube',
    icon: FaYoutube,
  },
]

export function Footer() {
  const [categories, setCategories] = useState<Category[]>(() => getStaticCategories())

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


  const categoryLinks: FooterLink[] = categories
    .filter((category) => !category.parentId)
    .slice(0, 5)
    .map((category) => ({
      href: buildCategoryUrl([category]),
      label: category.name,
      id: category.id,
    }))

  const renderLinkList = (links: FooterLink[]) => (
    <div className="flex flex-col gap-1">
      {links.map((link) => (
        <Link
          key={link.id || link.href}
          href={link.href}
          className="inline-flex min-h-11 items-center text-sm md:min-h-7 text-muted-foreground transition-colors duration-200 hover:text-primary hover:underline underline-offset-4"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )



  return (
    <footer className="site-footer mt-auto border-t-4 border-[#b8483e] bg-card text-card-foreground">
      <div className="border-b bg-background">
        <div className="container mx-auto grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
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

        </div>
      </div>
      <div className="container mx-auto px-4 pb-24 pt-8 md:pb-8 md:pt-10">
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-[1.2fr_0.85fr_0.9fr_1fr_1.2fr] xl:gap-8">
          <div className="min-w-0 space-y-4 md:max-w-xs">
            <Link href="/" aria-label="Jacketee home" className="inline-block"><BrandLogo /></Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Custom jackets, patches, embroidery, and team apparel made for standout everyday wear.
            </p>
            <div className="grid max-w-72 grid-cols-7 gap-1" aria-label="Social media links">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 min-w-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:h-9"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-3 xl:order-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Stay Updated</h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Get custom jacket updates, subscriber offers, and design guides.
            </p>
            <NewsletterForm />
          </div>

          {[
            { title: 'Categories', links: categoryLinks },
            { title: 'Customer Care', links: primaryCareLinks },
            { title: 'Custom Jackets', links: primaryDesignerLinks },
          ].filter(section => section.links.length > 0).map(section => (
            <details key={section.title} className="group border-b pb-4 md:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-wider">{section.title}<span aria-hidden="true" className="group-open:rotate-45">+</span></summary>
              {renderLinkList(section.links)}
            </details>
          ))}
          {[
            { title: 'Categories', links: categoryLinks },
            { title: 'Customer Care', links: primaryCareLinks },
            { title: 'Custom Jackets', links: primaryDesignerLinks },
          ].map(section => <div key={section.title} className="hidden space-y-4 md:block"><h3 className="text-sm font-semibold uppercase tracking-wider">{section.title}</h3>{renderLinkList(section.links)}</div>)}
        </div>

        <details className="group/explore mt-7 rounded-xl border border-border bg-white/[0.03] md:mt-8">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-5 [&::-webkit-details-marker]:hidden">
            <span><span className="block text-sm font-semibold">Explore More</span><span className="mt-1 block text-xs text-muted-foreground">Jacket collections, team programs &amp; helpful guides</span></span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open/explore:rotate-180" />
          </summary>
          <div className="grid gap-6 border-t border-border px-4 py-5 sm:px-5 md:grid-cols-[1fr_1.4fr_1fr] md:gap-8">
            {[
              { title: 'Resources & Guides', links: resourceLinks },
              { title: 'Jacket Collections', links: collectionLinks.filter(link => !link.href.startsWith('/bulk-orders/')) },
              { title: 'Teams & Groups', links: collectionLinks.filter(link => link.href.startsWith('/bulk-orders/')) },
            ].map(section => (
              <nav key={section.title} aria-label={`Footer ${section.title}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
                <ul className="mt-2 grid grid-cols-1 gap-x-5 sm:grid-cols-2 md:grid-cols-1">
                  {section.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-4 md:min-h-8">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </details>

        <div className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground md:mt-6 md:text-center">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
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
            &copy; {new Date().getFullYear()} Jacketee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
