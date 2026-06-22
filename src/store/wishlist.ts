import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addItem: (item: Omit<WishlistItem, 'id'>, userId?: string) => Promise<void>
  removeItem: (productId: string, userId?: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  loadFromServer: (userId: string) => Promise<void>
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (item, userId) => {
        const tempId = crypto.randomUUID()
        const newItem = { ...item, id: tempId }

        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state
          return { items: [...state.items, newItem] }
        })

        if (userId) {
          try {
            const res = await fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, productId: item.productId }),
            })
            if (res.ok) {
              const savedItem = await res.json()
              set((state) => ({
                items: state.items.map((i) => (i.productId === item.productId ? savedItem : i)),
              }))
            }
          } catch (error) {
            console.error('Error syncing wishlist item to server:', error)
          }
        }
      },

      removeItem: async (productId, userId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }))

        if (userId) {
          try {
            await fetch('/api/wishlist', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, productId }),
            })
          } catch (error) {
            console.error('Error syncing wishlist removal to server:', error)
          }
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId)
      },

      loadFromServer: async (userId) => {
        try {
          const res = await fetch(`/api/wishlist?userId=${userId}`)
          if (res.ok) {
            const data = await res.json()
            set({ items: data })
          }
        } catch (error) {
          console.error('Error loading wishlist from server:', error)
        }
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
    }
  )
)