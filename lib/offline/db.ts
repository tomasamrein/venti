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

export interface OfflineCashSession {
  id: string
  organization_id: string
  branch_id: string
  opened_by: string
  opened_at: string
  opening_amount: number
  status: string
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
  cash_sessions: EntityTable<OfflineCashSession, 'id'>
  sync_queue: EntityTable<SyncQueueItem, 'id'>
}

db.version(1).stores({
  products: 'id, barcode, organization_id, name, is_active',
  pending_sales: 'id, organization_id, branch_id',
  sync_queue: '++id, table_name, operation, created_at',
})

db.version(2).stores({
  products: 'id, barcode, organization_id, name, is_active',
  pending_sales: 'id, organization_id, branch_id',
  cash_sessions: 'id, branch_id, organization_id, status',
  sync_queue: '++id, table_name, operation, created_at',
})
