'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Receipt, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string }>
}

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  customers: { full_name: string } | null
}

const TYPE_LABEL: Record<string, string> = {
  A: 'Factura A',
  B: 'Factura B',
  C: 'Factura C',
  ticket: 'Ticket',
  non_fiscal: 'No fiscal',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-500/15 text-slate-400',
  issued: 'bg-emerald-500/15 text-emerald-400',
  canceled: 'bg-red-500/15 text-red-400',
  voided: 'bg-red-500/15 text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  canceled: 'Anulada',
  voided: 'Nula',
}

export default function FacturacionPage({ params }: Props) {
  const [orgSlug, setOrgSlug] = useState('')
  const [orgId, setOrgId] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadData = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    if (!org) return
    setOrgId(org.id)

    const { data } = await supabase
      .from('invoices')
      .select('*, customers(full_name)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(200)

    setInvoices((data as Invoice[]) ?? [])
    setLoading(false)
  }, [orgSlug])

  useEffect(() => { loadData() }, [loadData])

  const filtered = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.cae?.includes(q) ||
      String(inv.afip_comp_nro ?? '').includes(q) ||
      inv.invoice_type.toLowerCase().includes(q)
    )
  })

  // Lazy import to avoid loading invoice-form unless needed
  const [InvoiceForm, setInvoiceForm] = useState<React.ComponentType<{
    orgId: string
    orgSlug: string
    onClose: () => void
    onDone: () => void
  }> | null>(null)

  async function openForm() {
    if (!InvoiceForm) {
      const mod = await import('@/components/invoices/invoice-form')
      setInvoiceForm(() => mod.InvoiceForm)
    }
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} comprobantes emitidos</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={openForm}>
          <Plus className="h-4 w-4" />
          Nueva factura
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, CAE, número..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">N°</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">CAE</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {invoices.length === 0 ? 'Todavía no emitiste facturas.' : 'Sin resultados.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-sm">
                    {inv.afip_punto_venta
                      ? `${String(inv.afip_punto_venta).padStart(4, '0')}-${String(inv.afip_comp_nro ?? 0).padStart(8, '0')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-medium">
                      {TYPE_LABEL[inv.invoice_type] ?? inv.invoice_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {inv.customer_name ?? inv.customers?.full_name ?? 'Consumidor final'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {inv.cae ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[inv.status] ?? ''}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatARS(inv.total)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(inv.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${orgSlug}/facturacion/${inv.id}`}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && InvoiceForm && orgId && (
        <InvoiceForm
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); loadData() }}
        />
      )}
    </div>
  )
}
