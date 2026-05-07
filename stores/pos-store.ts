import { create } from 'zustand'

// Active cashier for drugstore employee switching
interface PosStore {
  activeCashierName: string | null
  activeCashierId: string | null
  setActiveCashier: (id: string | null, name: string | null) => void
}

export const usePosStore = create<PosStore>((set) => ({
  activeCashierName: null,
  activeCashierId: null,
  setActiveCashier: (id, name) => set({ activeCashierId: id, activeCashierName: name }),
}))
