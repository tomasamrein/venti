import { createClient } from '@/lib/supabase/client'
import { db, type SyncQueueItem } from './db'

const MAX_ATTEMPTS = 3

export async function syncProducts(organizationId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('id, organization_id, name, barcode, sku, price_sell, price_cost, stock_current, stock_min, unit, category_id, track_stock, allow_negative, is_active, updated_at')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (!data) return
  await db.products.bulkPut(data)
}

export async function drainSyncQueue() {
  const supabase = createClient()
  const items = await db.sync_queue.orderBy('created_at').toArray()

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) continue
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = supabase.from(item.table_name as any)
      if (item.operation === 'insert') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table as any).insert(item.data)
      } else if (item.operation === 'update') {
        const { id, ...rest } = item.data as Record<string, unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table as any).update(rest).eq('id', id as string)
      } else if (item.operation === 'delete') {
        const { id } = item.data as Record<string, unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table as any).delete().eq('id', id as string)
      }
      if (item.id !== undefined) await db.sync_queue.delete(item.id)
    } catch {
      if (item.id !== undefined) {
        await db.sync_queue.update(item.id, { attempts: (item.attempts ?? 0) + 1 } as Partial<SyncQueueItem>)
      }
    }
  }
}

export async function queueMutation(
  tableName: string,
  operation: SyncQueueItem['operation'],
  data: unknown,
  idempotencyKey: string,
) {
  await db.sync_queue.add({
    table_name: tableName,
    operation,
    data,
    idempotency_key: idempotencyKey,
    created_at: new Date().toISOString(),
    attempts: 0,
  })
}
