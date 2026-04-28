'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatARS } from '@/lib/utils/currency'

interface SalesChartProps {
  data: { hour: string; total: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Sin ventas registradas hoy
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={40}
        />
        <Tooltip
          formatter={(value) => [formatARS(Number(value ?? 0)), 'Ventas']}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#salesGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
