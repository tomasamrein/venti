import { z } from 'zod'

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Ingresá el nombre completo'),
  alias: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  cuit: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d{11}$/.test(v.replace(/-/g, '')), 'CUIT inválido'),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  has_account: z.boolean().default(false),
})

export const currentAccountSchema = z.object({
  credit_limit: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const accountPaymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  description: z.string().optional().nullable(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type CurrentAccountInput = z.infer<typeof currentAccountSchema>
export type AccountPaymentInput = z.infer<typeof accountPaymentSchema>
