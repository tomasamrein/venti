'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PricePoint {
  changed_at: string
  price_sell_new: number | null
  price_cost_new: number | null
  change_pct: number | null
}

interface PriceHistoryChartProps {
  history: PricePoint[]
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const data = history.map(h => ({
    date: format(new Date(h.changed_at), 'dd/MM/yy', { locale: es }),
    venta: h.price_sell_new ?? undefined,
    costo: h.price_cost_new ?? undefined,
    cambio_pct: h.change_pct ?? undefined,
  }))

  return (
    <Card className="border-border/60 max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base">Historial de precios</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={v => `$${v.toLocaleString('es-AR')}`}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value, name) => [formatARS(Number(value)), name === 'venta' ? 'Precio venta' : 'Precio costo']}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
            <Legend
              formatter={name => name === 'venta' ? 'Precio venta' : 'Precio costo'}
            />
            <Line
              type="stepAfter"
              dataKey="venta"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="stepAfter"
              dataKey="costo"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
