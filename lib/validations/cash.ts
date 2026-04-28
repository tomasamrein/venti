import { z } from 'zod'

export const openCashSessionSchema = z.object({
  opening_amount: z.coerce.number().min(0, 'El monto inicial no puede ser negativo'),
  notes: z.string().optional().nullable(),
})

export const closeCashSessionSchema = z.object({
  closing_amount: z.coerce.number().min(0, 'El monto contado no puede ser negativo'),
  notes: z.string().optional().nullable(),
})

export const cashMovementSchema = z.object({
  type: z.enum(['deposit', 'withdrawal', 'expense']),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  description: z.string().min(1, 'Ingresá una descripción'),
})

export const expenseSchema = z.object({
  category: z.string().default('general'),
  description: z.string().min(1, 'Ingresá una descripción'),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  supplier_id: z.string().uuid().optional().nullable(),
})

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>
export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema>
export type CashMovementInput = z.infer<typeof cashMovementSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
