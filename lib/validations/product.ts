import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  unit: z.string().default('un'),
  price_cost: z.coerce.number().min(0).optional().nullable(),
  price_sell: z.coerce.number().min(0, 'El precio de venta es requerido'),
  price_sell_b: z.coerce.number().min(0).optional().nullable(),
  tax_rate: z.coerce.number().min(0).max(100).default(21),
  stock_current: z.coerce.number().default(0),
  stock_min: z.coerce.number().min(0).default(0),
  stock_max: z.coerce.number().min(0).optional().nullable(),
  track_stock: z.boolean().default(true),
  allow_negative: z.boolean().default(false),
  brand: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

export const bulkPriceUpdateSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number(),
  apply_to: z.enum(['all', 'category', 'selection']),
  category_id: z.string().uuid().optional().nullable(),
  product_ids: z.array(z.string().uuid()).optional(),
  update_cost: z.boolean().default(false),
  reason: z.string().optional(),
})

export const productCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().default(0),
})

export type ProductInput = z.infer<typeof productSchema>
export type BulkPriceUpdateInput = z.infer<typeof bulkPriceUpdateSchema>
export type ProductCategoryInput = z.infer<typeof productCategorySchema>
