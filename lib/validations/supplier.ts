import { z } from 'zod'

const cuitRegex = /^\d{11}$|^\d{2}-\d{8}-\d{1}$/

export const supplierSchema = z.object({
  name: z.string().min(2, 'Ingresá el nombre del proveedor'),
  alias: z.string().optional().nullable(),
  cuil: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || cuitRegex.test(v.replace(/-/g, '')), 'CUIL inválido'),
  cuit: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || cuitRegex.test(v.replace(/-/g, '')), 'CUIT inválido'),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type SupplierInput = z.infer<typeof supplierSchema>
