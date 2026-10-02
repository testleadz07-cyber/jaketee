'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import { logUserActivity } from '@/lib/activity'

function pageMessage(pathname: string) {
  if (pathname.startsWith('/product/')) return 'I have a question about this product and its available options.'
  if (pathname.startsWith('/checkout')) return 'I need help completing my checkout.'
  if (pathname.includes('order')) return 'I need help with my order.'
  if (pathname.includes('cart')) return 'I have a question about the items in my cart.'
  if (pathname.includes('wishlist')) return 'I need help with a product in my wishlist.'
  if (pathname.includes('shipping')) return 'I have a question about shipping and delivery.'
  if (pathname.includes('returns')) return 'I have a question about returns or exchanges.'
  if (pathname.startsWith('/shop') || pathname.includes('categor')) return 'Please help me find the right jacket or product.'
  return 'I have a question. Can your team help me?'
}

function shouldIncludePageDetail(pathname: string, hasContextMessage: boolean) {
  return hasContextMessage || pathname !== '/'
}

export function WhatsAppButton({ message, className = '' }: { message?: string; className?: string }) {
  const pathname = usePathname() || '/'
  return (
    <a
      href={getWhatsAppUrl(`Hi Jacketee team! ${message || pageMessage(pathname)}`) || undefined}
      target="_blank"
      rel="noopener noreferrer"
      title="Ask the Jacketee team on WhatsApp"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#128C4A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0F753E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C4A] ${className}`}
      onClick={(event) => {
        const hasContextMessage = Boolean(message)
        const search = new URLSearchParams(window.location.search).get('search')
        const details = [message || pageMessage(pathname)]
        if (search) details.push(`I searched for "${search}".`)
        const filters = new URLSearchParams(window.location.search)
        filters.delete('search')
        // Share catalog filters, never checkout tokens or account query parameters.
        if (pathname === '/shop') {
          for (const key of ['category', 'size', 'color', 'sort']) {
            const value = filters.get(key)
            if (value) details.push(`${key}: ${value}.`)
          }
        }
        if (shouldIncludePageDetail(pathname, hasContextMessage)) {
          details.push(`Page: ${window.location.origin}${pathname}`)
        }
        event.currentTarget.href = getWhatsAppUrl(`Hi Jacketee team! ${details.join(' ')}`) || event.currentTarget.href
        void logUserActivity('contact_button_clicked', { channel: 'whatsapp', source: message ? 'contextual_help' : 'site_support' })
      }}
    >
      <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      WhatsApp
    </a>
  )
}

export function WhatsAppHelp({ message }: { message: string }) {
  return (
    <div className="mt-4 space-y-3 px-3 text-center">
      <p className="text-sm text-muted-foreground">Can&apos;t find what you need? Share your query on WhatsApp and the Jacketee team will help.</p>
      <WhatsAppButton message={message} />
    </div>
  )
}
