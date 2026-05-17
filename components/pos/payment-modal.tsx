'use client'

import { useState, useEffect } from 'react'
import { DollarSign, CreditCard, Banknote, BookOpen, Ticket, FileText, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatARS } from '@/lib/utils/currency'

export type InvoiceChoice =
  | { type: 'non_fiscal' }
  | { type: 'A' | 'B' | 'C'; customerCuit?: string; customerName?: string }

interface PaymentModalProps {
  open: boolean
  total: number
  hasCustomer: boolean
  hasArcaEnabled: boolean
  hasInvoicingEnabled: boolean
  customerCuit?: string
  customerName?: string
  onClose: () => void
  onConfirm: (method: string, amount: number, invoice: InvoiceChoice) => void
}

type Step = 'payment' | 'invoice'
type FiscalType = 'A' | 'B' | 'C'

export function PaymentModal({
  open, total, hasCustomer, hasArcaEnabled, hasInvoicingEnabled,
  customerCuit: prefillCuit, customerName: prefillName,
  onClose, onConfirm,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>('payment')
  const [method, setMethod] = useState<string>('cash')
  const [amount, setAmount] = useState(total)
  const [pendingAmount, setPendingAmount] = useState(0)

  // Invoice step state
  const [fiscalType, setFiscalType] = useState<FiscalType>('B')
  const [cuit, setCuit] = useState(prefillCuit ?? '')
  const [name, setName] = useState(prefillName ?? '')

  const change = method === 'cash' ? Math.max(0, amount - total) : 0

  useEffect(() => {
    if (open) {
      setStep('payment')
      setMethod('cash')
      setAmount(total)
      setCuit(prefillCuit ?? '')
      setName(prefillName ?? '')
      setFiscalType('B')
    }
  }, [open, total, prefillCuit, prefillName])

  function handleMethodChange(val: string | null) {
    setMethod(val || 'cash')
    setAmount(total)
  }

  function advanceToInvoice() {
    const finalAmount = method === 'cash' ? amount : total
    setPendingAmount(finalAmount)
    if (hasArcaEnabled && hasInvoicingEnabled) {
      setStep('invoice')
    } else {
      onConfirm(method, finalAmount, { type: 'non_fiscal' })
      onClose()
    }
  }

  function confirmNonFiscal() {
    onConfirm(method, pendingAmount, { type: 'non_fiscal' })
    onClose()
  }

  function confirmFiscal() {
    if (fiscalType === 'A' && !cuit.trim()) return
    onConfirm(method, pendingAmount, {
      type: fiscalType,
      customerCuit: cuit.trim() || undefined,
      customerName: name.trim() || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md rounded-2xl">

        {/* ── Step 1: Payment ── */}
        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-poppins">Método de pago</DialogTitle>
              <DialogDescription>
                Total a cobrar: <span className="font-bold text-foreground">{formatARS(total)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Seleccionar método</Label>
                <Select value={method} onValueChange={handleMethodChange}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Efectivo</div>
                    </SelectItem>
                    <SelectItem value="debit">
                      <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Débito</div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Crédito</div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4" />Transferencia / Billetera</div>
                    </SelectItem>
                    {hasCustomer && (
                      <SelectItem value="current_account">
                        <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Cuenta corriente</div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {method === 'cash' && (
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium mb-2 block">Monto recibido</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-xl h-11 text-lg font-semibold"
                    autoFocus
                  />
                </div>
              )}

              {method === 'cash' && (
                <div className={`p-4 rounded-xl border-2 ${change >= 0 ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'}`}>
                  <p className="text-sm text-muted-foreground mb-1">Vuelto</p>
                  <p className={`text-2xl font-bold font-poppins ${change >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {formatARS(change)}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">Cancelar</Button>
                <Button
                  onClick={advanceToInvoice}
                  disabled={method === 'cash' && amount < total}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {hasArcaEnabled && hasInvoicingEnabled ? 'Siguiente' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Comprobante (solo si ARCA habilitado) ── */}
        {step === 'invoice' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('payment')} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <DialogTitle className="font-poppins">¿Qué comprobante emitís?</DialogTitle>
              </div>
              <DialogDescription>
                Total: <span className="font-bold text-foreground">{formatARS(total)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Ticket no fiscal — opción rápida */}
              <button
                onClick={confirmNonFiscal}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
                  <Ticket className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ticket no fiscal</p>
                  <p className="text-xs text-muted-foreground">Sin CAE — para uso interno</p>
                </div>
              </button>

              {/* Factura fiscal */}
              <div className="rounded-xl border-2 border-border p-4 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Factura fiscal (ARCA)</p>
                    <p className="text-xs text-muted-foreground">Emite CAE en tiempo real</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Tipo de factura</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['B', 'A', 'C'] as FiscalType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFiscalType(t)}
                        className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                          fiscalType === t
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                            : 'border-border hover:border-blue-300'
                        }`}
                      >
                        {t}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {t === 'A' ? 'R. Inscripto' : t === 'B' ? 'Cons. Final' : 'Monotrib.'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {(fiscalType === 'A' || fiscalType === 'B' || fiscalType === 'C') && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">
                        CUIT {fiscalType === 'A' ? '*' : '(opcional)'}
                      </Label>
                      <Input
                        value={cuit}
                        onChange={e => setCuit(e.target.value)}
                        placeholder="20-12345678-9"
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Razón social (opcional)</Label>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={fiscalType === 'B' ? 'Consumidor Final' : 'Empresa S.A.'}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={confirmFiscal}
                  disabled={fiscalType === 'A' && !cuit.trim()}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Emitir Factura {fiscalType}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
