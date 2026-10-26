'use client'

import { usePathname } from 'next/navigation'
import { WhatsAppButton } from '@/components/whatsapp-help'

export function FloatingWhatsAppButton() {
  const isHome = usePathname() === '/'
  return (
    <div className={isHome ? "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40" : "fixed bottom-5 left-5 z-50"}>
      <WhatsAppButton compact className="max-sm:h-12 max-sm:w-12 max-sm:rounded-full max-sm:px-0 shadow-lg" />
    </div>
  )
}
