'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Share2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WhatsAppShare } from '@/components/invoices/whatsapp-share'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  customers: { full_name: string; phone: string | null } | null
}

type InvoiceItem = {
  description: string
  quantity: number
  unit_price: number
  discount_pct: number
  tax_rate: number
  subtotal: number
}

const TYPE_LABEL: Record<string, string> = {
  A: 'FACTURA A',
  B: 'FACTURA B',
  C: 'FACTURA C',
  ticket: 'TICKET',
  non_fiscal: 'COMPROBANTE',
}

export default function FacturaDetailPage({ params }: Props) {
  const router = useRouter()
  const [orgSlug, setOrgSlug] = useState('')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgCuit, setOrgCuit] = useState('')
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    params.then(async p => {
      setOrgSlug(p.orgSlug)
      const supabase = createClient()

      const [{ data: inv }, { data: org }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, customers(full_name, phone)')
          .eq('id', p.id)
          .single(),
        supabase
          .from('organizations')
          .select('name, cuit')
          .eq('slug', p.orgSlug)
          .single(),
      ])

      setInvoice(inv as Invoice)
      setOrgName(org?.name ?? '')
      setOrgCuit(org?.cuit ?? '')
      setLoading(false)
    })
  }, [params])

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">Cargando...</div>
  }

  if (!invoice) {
    return <div className="py-16 text-center text-muted-foreground">Factura no encontrada</div>
  }

  const items = (invoice.items as InvoiceItem[]) ?? []
  const nroFormatted = invoice.afip_punto_venta
    ? `${String(invoice.afip_punto_venta).padStart(4, '0')}-${String(invoice.afip_comp_nro ?? 0).padStart(8, '0')}`
    : '—'

  const qrUrl = invoice.qr_data
    ? `https://serviciosjava.afip.gob.ar/cae/qr/?p=${invoice.qr_data}`
    : null

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{TYPE_LABEL[invoice.invoice_type] ?? 'Comprobante'}</h1>
          <p className="text-sm text-muted-foreground">{nroFormatted}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {invoice.customers?.phone && (
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* Invoice card — also used for printing */}
      <div id="invoice-print" className="rounded-xl border bg-card p-6 space-y-5 print:border-0 print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl font-extrabold tracking-tight">{orgName}</p>
            <p className="text-sm text-muted-foreground">CUIT: {orgCuit}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold border-2 border-foreground px-4 py-2 rounded-lg">
              {invoice.invoice_type.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">N° {nroFormatted}</p>
          </div>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Fecha:</span>{' '}
            <span>{invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('es-AR') : '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>{' '}
            <Badge variant="outline" className="text-xs">
              {invoice.status === 'issued' ? 'Emitida' : invoice.status}
            </Badge>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Cliente:</span>{' '}
            <span>{invoice.customer_name ?? invoice.customers?.full_name ?? 'Consumidor final'}</span>
          </div>
          {invoice.customer_cuit && (
            <div>
              <span className="text-muted-foreground">CUIT:</span> <span>{invoice.customer_cuit}</span>
            </div>
          )}
          {invoice.customer_address && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Dirección:</span>{' '}
              <span>{invoice.customer_address}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Descripción</th>
                <th className="text-right px-3 py-2 font-medium">Cant.</th>
                <th className="text-right px-3 py-2 font-medium">P. Unit.</th>
                <th className="text-right px-3 py-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatARS(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right">{formatARS(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex gap-8">
            <span className="text-muted-foreground">Subtotal neto</span>
            <span>{formatARS(invoice.subtotal)}</span>
          </div>
          <div className="flex gap-8">
            <span className="text-muted-foreground">IVA</span>
            <span>{formatARS(invoice.tax_amount)}</span>
          </div>
          <div className="flex gap-8 text-base font-bold border-t pt-1 mt-1">
            <span>Total</span>
            <span>{formatARS(invoice.total)}</span>
          </div>
        </div>

        {/* CAE */}
        {invoice.cae && (
          <div className="border-t pt-4 flex items-start justify-between gap-4">
            <div className="text-xs space-y-0.5">
              <p><span className="text-muted-foreground">CAE:</span> <span className="font-mono">{invoice.cae}</span></p>
              <p><span className="text-muted-foreground">Vto. CAE:</span> {invoice.cae_vto ? new Date(invoice.cae_vto).toLocaleDateString('es-AR') : '—'}</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Comprobante válido ante ARCA</span>
              </div>
            </div>
            {qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}`}
                alt="QR ARCA"
                width={80}
                height={80}
                className="rounded"
              />
            )}
          </div>
        )}
      </div>

      {shareOpen && invoice.customers?.phone && (
        <WhatsAppShare
          phone={invoice.customers.phone}
          invoiceNumber={nroFormatted}
          total={invoice.total}
          orgName={orgName}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}
