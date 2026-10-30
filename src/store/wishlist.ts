import { apiFetch as fetch } from '@/lib/api-fetch'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createFunctionalStorage } from '@/lib/functional-storage'

export interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  slug: string
}
interface WishlistStore {
  items: WishlistItem[]
  ownerId: string | null
  guestItems: WishlistItem[]
  legacyItems: WishlistItem[]
  pendingAdds: string[]
  pendingRemoves: string[]
  drafts: Record<string, { items: WishlistItem[]; pendingAdds: string[]; pendingRemoves: string[] }>
  syncError: boolean
  setOwner: (userId: string | null) => void
  importLegacy: () => Promise<void>
  addItem: (item: Omit<WishlistItem, 'id'>, userId?: string) => Promise<void>
  removeItem: (productId: string, userId?: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  loadFromServer: (userId: string) => Promise<void>
  clearWishlist: () => void
}
type PersistedWishlist = Pick<WishlistStore, 'items' | 'ownerId' | 'guestItems' | 'legacyItems' | 'pendingAdds' | 'pendingRemoves' | 'drafts'>
const unique = (items: WishlistItem[]) => [...new Map(items.map(item => [item.productId, item])).values()]
let generation = 0
let revision = 0
let syncing: { owner: string; epoch: number; promise: Promise<void> } | undefined

export const useWishlistStore = create<WishlistStore>()(persist<WishlistStore, [], [], PersistedWishlist>((set, get) => ({
  items: [], ownerId: null, guestItems: [], legacyItems: [], pendingAdds: [], pendingRemoves: [], drafts: {}, syncError: false,
  setOwner: ownerId => {
    const state = get()
    if (state.ownerId === ownerId) return
    generation++; revision++
    const drafts = { ...state.drafts }
    if (state.ownerId) drafts[state.ownerId] = { items: state.items, pendingAdds: state.pendingAdds, pendingRemoves: state.pendingRemoves }
    const guests = state.ownerId === null ? unique([...state.guestItems, ...state.items]) : state.guestItems
    const draft = ownerId ? drafts[ownerId] : undefined
    // Pending guest imports become scoped to this account immediately. They
    // cannot leak into another login if sync fails or the user switches account.
    set({ ownerId, drafts, guestItems: ownerId ? [] : guests,
      items: ownerId ? unique([...(draft?.items || []), ...guests]) : guests,
      pendingAdds: ownerId ? [...new Set([...(draft?.pendingAdds || []), ...guests.map(item => item.productId)])] : [],
      pendingRemoves: draft?.pendingRemoves || [], syncError: false })
  },
  importLegacy: async () => {
    const state = get()
    const items = unique([...state.guestItems, ...state.legacyItems])
    revision++
    set({ legacyItems: [], ...(state.ownerId
      ? { items: unique([...state.items, ...state.legacyItems]), pendingAdds: [...new Set([...state.pendingAdds, ...state.legacyItems.map(item => item.productId)])] }
      : { guestItems: items, items }) })
    if (state.ownerId) await get().loadFromServer(state.ownerId)
  },
  addItem: async (item, userId) => {
    if (userId && get().ownerId !== userId) get().setOwner(userId)
    revision++
    const entry = { ...item, id: crypto.randomUUID() }
    set(state => ({ items: unique([...state.items, entry]),
      ...(state.ownerId ? { pendingAdds: [...new Set([...state.pendingAdds, item.productId])], pendingRemoves: state.pendingRemoves.filter(id => id !== item.productId) }
        : { guestItems: unique([...state.guestItems, entry]) }) }))
    const owner = get().ownerId
    if (owner) await get().loadFromServer(owner)
  },
  removeItem: async (productId, userId) => {
    if (userId && get().ownerId !== userId) get().setOwner(userId)
    revision++
    set(state => ({ items: state.items.filter(item => item.productId !== productId), guestItems: state.guestItems.filter(item => item.productId !== productId),
      pendingAdds: state.pendingAdds.filter(id => id !== productId),
      ...(state.ownerId ? { pendingRemoves: [...new Set([...state.pendingRemoves, productId])] } : {}) }))
    const owner = get().ownerId
    if (owner) await get().loadFromServer(owner)
  },
  isInWishlist: productId => get().items.some(item => item.productId === productId),
  loadFromServer: async owner => {
    if (get().ownerId !== owner) return
    if (syncing?.owner === owner && syncing.epoch === generation) return syncing.promise
    const epoch = generation
    const task = async () => {
      try {
        // A mutation during an await changes revision; fetch again instead of
        // overwriting the user's newer additions/removals with an old response.
        for (;;) {
          if (get().ownerId !== owner || generation !== epoch) return
          const state = get(), version = revision
          const guest = state.guestItems.map(item => item.productId)
          const adds = [...new Set([...guest, ...state.pendingAdds])].slice(0, 100)
          const removes = state.pendingRemoves.slice(0, 100)
          if (adds.length || removes.length) {
            const response = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'merge', expectedOwner: owner, productIds: adds, removeProductIds: removes }), signal: AbortSignal.timeout(20000) })
            if (!response.ok) throw new Error('Wishlist sync failed')
            if (get().ownerId !== owner || generation !== epoch) return
            if (revision !== version) continue
            set(current => ({ guestItems: current.guestItems.filter(item => !adds.includes(item.productId)),
              pendingAdds: current.pendingAdds.filter(id => !adds.includes(id)), pendingRemoves: current.pendingRemoves.filter(id => !removes.includes(id)) }))
            if (get().guestItems.length || get().pendingAdds.length || get().pendingRemoves.length) continue
          }
          const response = await fetch(`/api/wishlist?userId=${encodeURIComponent(owner)}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
          if (!response.ok) throw new Error('Wishlist load failed')
          const items = await response.json()
          if (!Array.isArray(items)) throw new Error('Invalid wishlist response')
          if (get().ownerId !== owner || generation !== epoch) return
          if (revision !== version) continue
          set({ items: unique(items), syncError: false })
          return
        }
      } catch {
        if (get().ownerId === owner && generation === epoch) set({ syncError: true })
      }
    }
    const promise = task()
    const current = { owner, epoch, promise }
    syncing = current
    try { await promise } finally { if (syncing === current) syncing = undefined }
  },
  clearWishlist: () => { generation++; revision++; set({ items: [], guestItems: [], pendingAdds: [], pendingRemoves: [] }) },
}), {
  name: 'wishlist-storage', version: 1,
  storage: createFunctionalStorage<PersistedWishlist>(),
  partialize: state => ({ items: state.items, ownerId: state.ownerId, guestItems: state.guestItems, legacyItems: state.legacyItems,
    pendingAdds: state.pendingAdds, pendingRemoves: state.pendingRemoves, drafts: state.drafts }),
  // Legacy data has no owner marker. Preserve it for explicit import, never
  // silently assign a previous account's cached wishlist to a new account.
  migrate: (persisted: any) => ({ items: [], ownerId: null, guestItems: [], legacyItems: persisted?.items || [], pendingAdds: [], pendingRemoves: [], drafts: {} }),
}))
