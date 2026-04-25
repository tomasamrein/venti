import Dexie, { type EntityTable } from 'dexie'

export interface OfflineProduct {
  id: string
  organization_id: string
  name: string
  barcode: string | null
  sku: string | null
  price_sell: number
  price_cost: number | null
  stock_current: number
  stock_min: number
  unit: string
  category_id: string | null
  track_stock: boolean
  allow_negative: boolean
  is_active: boolean
  updated_at: string
}

export interface OfflinePendingSale {
  id: string
  organization_id: string
  branch_id: string
  items: unknown[]
  label: string | null
  notes: string | null
  created_at: string
}

export interface SyncQueueItem {
  id?: number
  table_name: string
  operation: 'insert' | 'update' | 'delete'
  data: unknown
  idempotency_key: string
  created_at: string
  attempts: number
}

export const db = new Dexie('venti_offline') as Dexie & {
  products: EntityTable<OfflineProduct, 'id'>
  pending_sales: EntityTable<OfflinePendingSale, 'id'>
  sync_queue: EntityTable<SyncQueueItem, 'id'>
}

db.version(1).stores({
  products: 'id, barcode, organization_id, name, is_active',
  pending_sales: 'id, organization_id, branch_id',
  sync_queue: '++id, table_name, operation, created_at',
})
