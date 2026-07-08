import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentlyViewedItem {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  images: Array<{ url: string; alt: string }>
  category: {
    name: string
    slug: string
  }
  isFeatured: boolean
  viewedAt: number
}

const MAX_RECENTLY_VIEWED = 12

interface RecentlyViewedStore {
  items: RecentlyViewedItem[]
  addItem: (product: Omit<RecentlyViewedItem, 'viewedAt'>) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const withoutCurrent = state.items.filter((item) => item.id !== product.id)
          const updated = [{ ...product, viewedAt: Date.now() }, ...withoutCurrent]
          return { items: updated.slice(0, MAX_RECENTLY_VIEWED) }
        })
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
)
