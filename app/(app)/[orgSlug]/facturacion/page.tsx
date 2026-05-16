'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, XCircle, Receipt, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatARS } from '@/lib/utils/currency'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import type { Database } from '@/types/database'
import { useOrg } from '@/hooks/use-org'
import { hasInvoicing } from '@/lib/utils/plan'

interface Props {
  params: Promise<{ orgSlug: string }>
}

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  customers: { full_name: string } | null
}

type Sale = {
  id: string
  sale_number: number | null
  total: number
  payment_method: string
  completed_at: string | null
  created_at: string
  customers: { full_name: string; cuit: string | null } | null
  invoices: { id: string; status: string }[]
}

type FiscalType = 'A' | 'B' | 'C'

const TYPE_LABEL: Record<string, string> = {
  A: 'Factura A', B: 'Factura B', C: 'Factura C',
  ticket: 'Ticket', non_fiscal: 'No fiscal',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-500/15 text-slate-400',
  issued: 'bg-emerald-500/15 text-emerald-400',
  canceled: 'bg-red-500/15 text-red-400',
  voided: 'bg-red-500/15 text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', issued: 'Emitida', canceled: 'Anulada', voided: 'Nula',
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Efectivo', debit: 'Débito', credit: 'Crédito',
  transfer: 'Transferencia', current_account: 'Cta. cte.',
}

export default function FacturacionPage({ params }: Props) {
  const { org } = useOrg()
  const [orgSlug, setOrgSlug] = useState('')
  const [orgId, setOrgId] = useState('')
  const [orgBranchId, setOrgBranchId] = useState('')
  const [hasArca, setHasArca] = useState(false)
  const [planType, setPlanType] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [unfacturadas, setUnfacturadas] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'sin_factura' | 'emitidas'>('sin_factura')
  const [showForm, setShowForm] = useState(false)

  // Facturar modal state
  const [facturarSale, setFacturarSale] = useState<Sale | null>(null)
  const [fiscalType, setFiscalType] = useState<FiscalType>('B')
  const [cuit, setCuit] = useState('')
  const [nombre, setNombre] = useState('')
  const [emitting, setEmitting] = useState(false)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadData = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id, settings')
      .eq('slug', orgSlug)
      .single()
    if (!org) return
    setOrgId(org.id)
    setHasArca(!!((org.settings as any)?.arca?.vault_cert_id))

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('subscription_plans(type)')
      .eq('organization_id', org.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setPlanType((sub?.subscription_plans as { type?: string } | null)?.type ?? null)

    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('is_main', { ascending: false })
      .limit(1)
      .single()
    if (branch) setOrgBranchId(branch.id)

    const [{ data: invData }, { data: salesData }] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, customers(full_name)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('sales')
        .select('id, sale_number, total, payment_method, completed_at, created_at, customers(full_name, cuit), invoices(id, status)')
        .eq('organization_id', org.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    setInvoices((invData as Invoice[]) ?? [])

    const withoutIssuedInvoice = ((salesData ?? []) as Sale[]).filter(s =>
      !s.invoices?.some(i => i.status === 'issued')
    )
    setUnfacturadas(withoutIssuedInvoice)
    setLoading(false)
  }, [orgSlug])

  useEffect(() => { loadData() }, [loadData])

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.cae?.includes(q) ||
      String(inv.afip_comp_nro ?? '').includes(q) ||
      inv.invoice_type.toLowerCase().includes(q)
    )
  })

  const filteredUnfacturadas = unfacturadas.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.customers?.full_name?.toLowerCase().includes(q) ||
      String(s.sale_number ?? '').includes(q)
    )
  })

  const [InvoiceForm, setInvoiceForm] = useState<React.ComponentType<{
    orgId: string; orgSlug: string; onClose: () => void; onDone: () => void
  }> | null>(null)

  async function voidInvoice(invoiceId: string) {
    if (!confirm('¿Anular esta factura? Se emitirá una Nota de Crédito en ARCA.')) return
    try {
      const res = await fetch('/api/arca/credit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al anular'); return }
      toast.success(`Nota de Crédito emitida — CAE: ${json.cae}`)
      loadData()
    } catch {
      toast.error('Error al conectar con el servidor')
    }
  }

  async function openForm() {
    if (!InvoiceForm) {
      const mod = await import('@/components/invoices/invoice-form')
      setInvoiceForm(() => mod.InvoiceForm)
    }
    setShowForm(true)
  }

  function openFacturar(sale: Sale) {
    setFacturarSale(sale)
    setFiscalType('B')
    setCuit(sale.customers?.cuit ?? '')
    setNombre(sale.customers?.full_name ?? '')
  }

  async function handleEmitir() {
    if (!facturarSale || !orgBranchId) return
    if (fiscalType === 'A' && !cuit.trim()) {
      toast.error('CUIT requerido para Factura A'); return
    }
    setEmitting(true)
    try {
      const supabase = createClient()
      const { data: items } = await supabase
        .from('sale_items')
        .select('name, unit_price, quantity, discount_pct, tax_rate, subtotal')
        .eq('sale_id', facturarSale.id)

      const res = await fetch('/api/arca/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          branch_id: orgBranchId,
          sale_id: facturarSale.id,
          invoice_type: fiscalType,
          customer_name: nombre.trim() || undefined,
          customer_cuit: cuit.trim() || undefined,
          items: (items ?? []).map(i => ({
            name: i.name,
            unit_price: i.unit_price,
            quantity: i.quantity,
            discount_pct: i.discount_pct ?? 0,
            tax_rate: i.tax_rate,
            subtotal: i.subtotal,
          })),
          subtotal: facturarSale.total,
          tax_amount: 0,
          total: facturarSale.total,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(`Error ARCA: ${json.error ?? 'desconocido'}`)
      } else {
        toast.success(`Factura ${fiscalType} emitida — CAE: ${json.invoice?.cae}`)
        setFacturarSale(null)
        loadData()
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setEmitting(false)
    }
  }

  const planAllowsInvoicing = hasInvoicing(planType)

  if (!loading && planType !== null && !planAllowsInvoicing) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-sm text-muted-foreground">Emitir facturas A, B y C con CAE de ARCA</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <Lock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Disponible en plan Avanzado</h2>
              <p className="text-sm text-muted-foreground">
                La facturación electrónica con ARCA/AFIP está incluida desde el plan Avanzado en adelante.
              </p>
            </div>
          </div>
          <ul className="space-y-2 pl-1 text-sm">
            <li className="flex items-start gap-2"><Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Factura A, B y C con CAE al instante</li>
            <li className="flex items-start gap-2"><Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> PDF y envío por WhatsApp</li>
            <li className="flex items-start gap-2"><Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Notas de crédito y anulaciones</li>
          </ul>
          <Link
            href={`/${orgSlug}/configuracion/suscripcion`}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-sm text-muted-foreground">
            {tab === 'sin_factura'
              ? `${unfacturadas.length} ventas sin facturar`
              : `${invoices.length} comprobantes emitidos`}
          </p>
        </div>
        {hasArca && (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openForm}>
            <Plus className="h-4 w-4" />
            Nueva factura
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit">
        <button
          onClick={() => setTab('sin_factura')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'sin_factura' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Sin facturar
          {unfacturadas.length > 0 && (
            <span className="ml-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-1.5 py-0.5 rounded-full">{unfacturadas.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('emitidas')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'emitidas' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Emitidas
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tab === 'sin_factura' ? 'Buscar por cliente o número...' : 'Buscar por cliente, CAE, número...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Tab: ventas sin factura */}
      {tab === 'sin_factura' && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Venta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Método</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Cargando...</td></tr>
              ) : filteredUnfacturadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {unfacturadas.length === 0 ? 'Todas las ventas están facturadas.' : 'Sin resultados.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUnfacturadas.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-sm">
                      {s.sale_number ? `#${s.sale_number}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {s.customers?.full_name ?? 'Consumidor final'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {PAYMENT_LABEL[s.payment_method] ?? s.payment_method}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatARS(s.total)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(s.completed_at ?? s.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasArca ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg"
                          onClick={() => openFacturar(s)}>
                          Facturar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin ARCA</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: facturas emitidas */}
      {tab === 'emitidas' && (
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
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {invoices.length === 0 ? 'Todavía no emitiste facturas.' : 'Sin resultados.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
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
                    <td className="px-4 py-3 flex items-center gap-2">
                      <Link href={`/${orgSlug}/facturacion/${inv.id}`} className="text-xs text-emerald-600 hover:underline">
                        Ver
                      </Link>
                      {inv.status === 'issued' && inv.cae && (
                        <button onClick={() => voidInvoice(inv.id)} title="Anular (NC)"
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && InvoiceForm && orgId && (
        <InvoiceForm
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); loadData() }}
        />
      )}

      {/* Modal: emitir factura para venta existente */}
      <Dialog open={!!facturarSale} onOpenChange={v => { if (!v) setFacturarSale(null) }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins">Emitir comprobante fiscal</DialogTitle>
            <DialogDescription>
              Venta #{facturarSale?.sale_number ?? '—'} — {formatARS(facturarSale?.total ?? 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Tipo de factura</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['B', 'A', 'C'] as FiscalType[]).map(t => (
                  <button key={t} type="button" onClick={() => setFiscalType(t)}
                    className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${fiscalType === t
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                      : 'border-border hover:border-blue-300'}`}>
                    {t}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t === 'A' ? 'R. Inscripto' : t === 'B' ? 'Cons. Final' : 'Monotrib.'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  CUIT {fiscalType === 'A' ? '*' : '(opcional)'}
                </Label>
                <Input value={cuit} onChange={e => setCuit(e.target.value)}
                  placeholder="20-12345678-9" className="h-9 rounded-lg text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Razón social (opcional)</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder={fiscalType === 'B' ? 'Consumidor Final' : 'Empresa S.A.'}
                  className="h-9 rounded-lg text-sm" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setFacturarSale(null)}>
                Cancelar
              </Button>
              <Button
                disabled={emitting || (fiscalType === 'A' && !cuit.trim())}
                onClick={handleEmitir}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                {emitting ? 'Emitiendo...' : `Emitir Factura ${fiscalType}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
