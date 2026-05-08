'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatARS } from '@/lib/utils/currency'
import { useTheme } from 'next-themes'

interface SalesChartProps {
  data: { label: string; total: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'

  if (data.length === 0 || data.every(d => d.total === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Sin ventas registradas
      </div>
    )
  }

  const gridColor = dark ? '#334155' : '#e2e8f0'
  const axisColor = dark ? '#64748b' : '#94a3b8'
  const tooltipBg = dark ? '#1e293b' : '#ffffff'
  const tooltipBorder = dark ? '#334155' : '#e2e8f0'
  const tooltipText = dark ? '#f1f5f9' : '#1e293b'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={dark ? 0.4 : 0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: axisColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: axisColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={40}
        />
        <Tooltip
          formatter={(value) => [formatARS(Number(value ?? 0)), 'Ventas']}
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            fontSize: 12,
            color: tooltipText,
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
