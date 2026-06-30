import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  variants: Array<{
    name: string
    value: string
  }>
}

export interface AppliedPromo {
  code: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number
  minOrderValue: number
  discountAmount: number
  freeShipping: boolean
}

interface CartStore {
  items: CartItem[]
  appliedPromo: AppliedPromo | null
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  setAppliedPromo: (promo: AppliedPromo | null) => void
  clearAppliedPromo: () => void
  getDiscountedTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromo: null,

      addItem: (item) =>
        set((state) => {
          const variantKey = item.variants.map(v => `${v.name}:${v.value}`).sort().join('|')

          const existingItem = state.items.find(
            (i) => {
              const existingKey = i.variants.map(v => `${v.name}:${v.value}`).sort().join('|')
              return i.productId === item.productId && existingKey === variantKey
            }
          )

          const qty = item.quantity || 1

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === existingItem.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }

          return {
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID(), quantity: qty },
            ],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== id)
              : state.items.map((item) =>
                  item.id === id ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ items: [], appliedPromo: null }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      setAppliedPromo: (promo) => set({ appliedPromo: promo }),

      clearAppliedPromo: () => set({ appliedPromo: null }),

      getDiscountedTotalPrice: () => {
        const subtotal = get().getTotalPrice()
        const promo = get().appliedPromo
        if (!promo) return subtotal
        
        // Dynamic re-verification of the discount amount locally
        if (subtotal < promo.minOrderValue) {
          // If subtotal drops below minimum required, the promo is no longer active
          return subtotal
        }

        let amount = 0
        if (promo.discountType === 'percentage') {
          amount = (subtotal * promo.discountValue) / 100
        } else if (promo.discountType === 'fixed') {
          amount = promo.discountValue
        }

        if (amount > subtotal) {
          amount = subtotal
        }

        return Number((subtotal - amount).toFixed(2))
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)