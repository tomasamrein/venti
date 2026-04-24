import { create } from 'zustand'
import type { Database } from '@/types/database'

export type CartItem = Database['public']['Tables']['products']['Row'] & {
  cart_quantity: number
  cart_discount_pct?: number
}

interface CartStore {
  items: CartItem[]
  customer_id: string | null
  discount_pct: number
  notes: string
  addItem: (product: Database['public']['Tables']['products']['Row'], quantity: number) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  setCustomer: (customerId: string | null) => void
  setDiscount: (discount: number) => void
  setNotes: (notes: string) => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customer_id: null,
  discount_pct: 0,
  notes: '',

  addItem: (product, quantity) => {
    const state = get()
    const existing = state.items.find(i => i.id === product.id)

    if (existing) {
      set({
        items: state.items.map(i =>
          i.id === product.id
            ? { ...i, cart_quantity: i.cart_quantity + quantity }
            : i
        ),
      })
    } else {
      set({
        items: [...state.items, { ...product, cart_quantity: quantity }],
      })
    }
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        i.id === productId ? { ...i, cart_quantity: quantity } : i
      ),
    }))
  },

  removeItem: (productId) => {
    set(state => ({
      items: state.items.filter(i => i.id !== productId),
    }))
  },

  clear: () => {
    set({ items: [], customer_id: null, discount_pct: 0, notes: '' })
  },

  setCustomer: (customerId) => {
    set({ customer_id: customerId })
  },

  setDiscount: (discount) => {
    set({ discount_pct: Math.max(0, Math.min(100, discount)) })
  },

  setNotes: (notes) => {
    set({ notes })
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.price_sell || 0) * item.cart_quantity
    }, 0)
  },

  getTotal: () => {
    const state = get()
    const subtotal = state.getSubtotal()
    const discountAmount = subtotal * (state.discount_pct / 100)
    return Math.max(0, subtotal - discountAmount)
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.cart_quantity, 0)
  },
}))
