export interface ArcaSettings {
  cuit: string
  punto_venta: number
  cert_pem: string
  key_pem: string
  environment: 'homologation' | 'production'
  token_cache?: ArcaTokenCache
}

export interface ArcaToken {
  token: string
  sign: string
  expires_at: string
}

export interface ArcaTokenCache extends ArcaToken {
  generated_at: string
}

export type InvoiceType = 'A' | 'B' | 'C' | 'ticket' | 'non_fiscal'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  discount_pct: number
  tax_rate: number
  subtotal: number
}

export interface InvoiceRequest {
  org_id: string
  branch_id: string
  sale_id?: string
  invoice_type: InvoiceType
  customer_id?: string
  customer_name?: string
  customer_cuit?: string
  customer_address?: string
  items: InvoiceLineItem[]
  subtotal: number
  tax_amount: number
  total: number
}

export interface FECAEResult {
  invoice_number: number
  cae: string
  cae_vto: string
  comp_tipo: number
}
