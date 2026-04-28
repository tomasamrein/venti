import { z } from 'zod'

export const saleItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  barcode: z.string().optional().nullable(),
  unit_price: z.number().min(0),
  quantity: z.number().min(0.001),
  discount_pct: z.number().min(0).max(100).default(0),
  tax_rate: z.number().min(0).max(100).default(21),
  subtotal: z.number().min(0),
})

export const completeSaleSchema = z.object({
  organization_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  session_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(['cash', 'debit', 'credit', 'transfer', 'mercadopago', 'current_account', 'mixed']),
  subtotal: z.number().min(0),
  discount_pct: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  total: z.number().min(0),
  amount_paid: z.number().min(0).optional().nullable(),
  change_amount: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'Agregá al menos un producto'),
})

export const pendingSaleSchema = z.object({
  label: z.string().optional().nullable(),
  items: z.array(saleItemSchema),
  customer_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type SaleItemInput = z.infer<typeof saleItemSchema>
export type CompleteSaleInput = z.infer<typeof completeSaleSchema>
export type PendingSaleInput = z.infer<typeof pendingSaleSchema>
