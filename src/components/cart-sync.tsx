'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cart'

// Silently mirrors the client-side cart to the server whenever it changes,
// but only for signed-in users (guests can't check out anyway, so there's no
// email to send a recovery reminder to). Debounced so rapid quantity changes
// don't spam the API.
export function CartSync() {
  const { status } = useSession()
  const items = useCartStore((state) => state.items)
  const appliedPromo = useCartStore((state) => state.appliedPromo)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          subtotal,
          promoCode: appliedPromo?.code,
        }),
      }).catch(() => {
        // Best-effort only — cart tracking should never disrupt shopping.
      })
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [status, items, appliedPromo])

  return null
}
