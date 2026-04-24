'use client'

import { useState } from 'react'
import { DollarSign, CreditCard, Banknote } from 'lucide-react'
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

interface PaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onConfirm: (method: string, amount: number) => void
}

export function PaymentModal({ open, total, onClose, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<string>('cash')
  const [amount, setAmount] = useState(total)
  const change = method === 'cash' ? Math.max(0, amount - total) : 0

  const handleConfirm = () => {
    onConfirm(method, amount)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-poppins">Método de pago</DialogTitle>
          <DialogDescription>
            Total a cobrar: <span className="font-bold text-foreground">{formatARS(total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment method selector */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Seleccionar método</Label>
            <Select value={method} onValueChange={(val) => setMethod(val || 'cash')}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value="debit">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Débito
                  </div>
                </SelectItem>
                <SelectItem value="credit">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Crédito
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Transferencia
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount input */}
          {method === 'cash' && (
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                Monto recibido
              </Label>
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

          {/* Change display */}
          {method === 'cash' && (
            <div className={`p-4 rounded-xl border-2 ${change >= 0 ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'}`}>
              <p className="text-sm text-muted-foreground mb-1">Vuelto</p>
              <p className={`text-2xl font-bold font-poppins ${change >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {formatARS(change)}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={method === 'cash' && amount < total}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
