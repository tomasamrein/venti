import { create } from 'zustand'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

// Lean cart item — covers both regular products and services (fotocopiadora, etc.)
export interface CartItem {
  id: string              // cart key: product.id OR generated UUID for services
  product_id: string | null  // null for service items
  is_service: boolean
  name: string
  price_sell: number
  cart_quantity: number
  cart_discount_pct: number
  tax_rate: number
  barcode: string | null
  track_stock: boolean
  stock_current: number
  allow_negative: boolean
  organization_id: string
  image_url: string | null
  unit: string
}

interface CartStore {
  items: CartItem[]
  customer_id: string | null
  discount_pct: number
  notes: string
  addItem: (product: ProductRow, quantity?: number) => void
  addServiceItem: (service: {
    name: string
    price_sell: number
    quantity: number
    tax_rate?: number
    organization_id: string
  }) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
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

  addItem: (product, quantity = 1) => {
    const state = get()
    const existing = state.items.find(i => i.product_id === product.id)

    if (existing) {
      set({
        items: state.items.map(i =>
          i.product_id === product.id
            ? { ...i, cart_quantity: i.cart_quantity + quantity }
            : i
        ),
      })
    } else {
      const item: CartItem = {
        id: product.id,
        product_id: product.id,
        is_service: false,
        name: product.name,
        price_sell: product.price_sell ?? 0,
        cart_quantity: quantity,
        cart_discount_pct: 0,
        tax_rate: product.tax_rate ?? 21,
        barcode: product.barcode ?? null,
        track_stock: product.track_stock,
        stock_current: product.stock_current ?? 0,
        allow_negative: product.allow_negative,
        organization_id: product.organization_id,
        image_url: product.image_url ?? null,
        unit: product.unit ?? 'un',
      }
      set({ items: [...state.items, item] })
    }
  },

  addServiceItem: (service) => {
    const id = crypto.randomUUID()
    const item: CartItem = {
      id,
      product_id: null,
      is_service: true,
      name: service.name,
      price_sell: service.price_sell,
      cart_quantity: service.quantity,
      cart_discount_pct: 0,
      tax_rate: service.tax_rate ?? 21,
      barcode: null,
      track_stock: false,
      stock_current: 0,
      allow_negative: true,
      organization_id: service.organization_id,
      image_url: null,
      unit: 'un',
    }
    set(state => ({ items: [...state.items, item] }))
  },

  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    set(state => ({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, cart_quantity: quantity } : i
      ),
    }))
  },

  removeItem: (itemId) => {
    set(state => ({ items: state.items.filter(i => i.id !== itemId) }))
  },

  clear: () => {
    set({ items: [], customer_id: null, discount_pct: 0, notes: '' })
  },

  setCustomer: (customerId) => set({ customer_id: customerId }),
  setDiscount: (discount) => set({ discount_pct: Math.max(0, Math.min(100, discount)) }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price_sell * item.cart_quantity, 0)
  },

  getTotal: () => {
    const state = get()
    const subtotal = state.getSubtotal()
    return Math.max(0, subtotal - subtotal * (state.discount_pct / 100))
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.cart_quantity, 0)
  },
}))
