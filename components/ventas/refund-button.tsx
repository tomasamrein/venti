'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RefundButtonProps {
  saleId: string
  hasCustomer: boolean
  total: number
}

export function RefundButton({ saleId, hasCustomer, total }: RefundButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [creditToAccount, setCreditToAccount] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRefund() {
    if (!reason.trim()) return toast.error('Ingresá el motivo de la devolución')
    setLoading(true)
    try {
      const res = await fetch('/api/sales/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, reason, creditToAccount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar devolución')
      toast.success('Devolución registrada correctamente')
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al procesar devolución')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-[12px] rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Registrar devolución
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar devolución</DialogTitle>
            <DialogDescription>
              Esto marcará la venta como reembolsada y repondrá el stock de los productos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-reason" className="mb-1.5 block text-[13px]">
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: Producto defectuoso, cambio de opinión..."
                className="rounded-xl resize-none"
                rows={3}
                autoFocus
              />
            </div>

            {hasCustomer && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creditToAccount}
                  onChange={e => setCreditToAccount(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <p className="text-[13px] font-medium">Acreditar en cuenta corriente</p>
                  <p className="text-[11px] text-muted-foreground">
                    El cliente recibirá {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)} de crédito en su cuenta
                  </p>
                </div>
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRefund}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar devolución'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
