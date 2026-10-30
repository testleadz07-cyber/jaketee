'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useWishlistStore } from '@/store/wishlist'

export function WishlistSync() {
  const { data: session, status } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id || null
  const [hydrated, setHydrated] = useState(false)
  const legacy = useWishlistStore(state => state.legacyItems)
  const syncError = useWishlistStore(state => state.syncError)
  useEffect(() => {
    const finish = () => setHydrated(true)
    const unsubscribe = useWishlistStore.persist.onFinishHydration(finish)
    if (useWishlistStore.persist.hasHydrated()) finish()
    return unsubscribe
  }, [])
  useEffect(() => {
    if (!hydrated || status === 'loading') return
    const store = useWishlistStore.getState()
    store.setOwner(status === 'authenticated' ? userId : null)
    const sync = () => {
      if (status === 'authenticated' && userId) void useWishlistStore.getState().loadFromServer(userId)
    }
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('focus', sync)
    return () => { window.removeEventListener('online', sync); window.removeEventListener('focus', sync) }
  }, [hydrated, status, userId])
  if (!hydrated || status !== 'authenticated' || !userId) return null
  if (!legacy.length && !syncError) return null
  return <div role="status" className="border-b bg-card px-4 py-3 text-sm text-foreground flex flex-wrap justify-center items-center gap-3">
    {legacy.length > 0 ? <>
      <span>Import this browser’s previously saved wishlist into your account?</span>
      <button type="button" className="underline" onClick={() => void useWishlistStore.getState().importLegacy()}>Import saved items</button>
      <button type="button" className="underline" onClick={() => useWishlistStore.setState({ legacyItems: [] })}>Dismiss</button>
    </> : <>
      <span>Wishlist sync could not finish. Your current changes are kept for retry.</span>
      <button type="button" className="underline" onClick={() => void useWishlistStore.getState().loadFromServer(userId)}>Retry sync</button>
    </>}
  </div>
}
