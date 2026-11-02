import { format, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '@/lib/format'
import { AD_NETWORK_LABELS, CLAIM_SOURCE_LABELS, type AdStats } from '../types/ads.types'

/** Recessive axes/grid; series wear the validated --series-1 / --series-2 pair; text stays in text tokens. */
const AXIS = { stroke: 'var(--border)', tick: { fill: 'var(--muted-foreground)', fontSize: 12 } }
const TOOLTIP = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--popover-foreground)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 500 },
  formatter: (value: unknown) => formatNumber(Number(value)),
}
const LEGEND = {
  wrapperStyle: { fontSize: 12, color: 'var(--muted-foreground)' },
  iconType: 'circle' as const,
  iconSize: 8,
}

export function ClaimsOverTimeChart({ series }: { series: AdStats['series'] }) {
  if (series.length === 0)
    return <p className="py-10 text-center text-sm text-muted-foreground">No claims in this period.</p>
  const data = series.map((day) => ({ ...day, label: format(parseISO(day.date), 'd MMM') }))
  return (
    <div className="h-72" role="img" aria-label="Line chart: claims created and completed per day">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="label" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} tickLine={false} axisLine={false} width={48} allowDecimals={false} />
          <Tooltip {...TOOLTIP} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} />
          <Legend {...LEGEND} />
          <Line
            type="monotone"
            dataKey="claimsCreated"
            name="Created"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="claimsCompleted"
            name="Completed"
            stroke="var(--series-2)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ClaimsBySourceChart({ bySource }: { bySource: AdStats['bySource'] }) {
  const data = bySource.map((item) => ({ ...item, label: CLAIM_SOURCE_LABELS[item.source] ?? item.source }))
  return (
    <div className="h-56" role="img" aria-label="Bar chart: claims created and completed by source">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="label" {...AXIS} tickLine={false} />
          <YAxis {...AXIS} tickLine={false} axisLine={false} width={48} allowDecimals={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Legend {...LEGEND} />
          <Bar
            dataKey="claimsCreated"
            name="Created"
            fill="var(--series-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="claimsCompleted"
            name="Completed"
            fill="var(--series-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompletedByNetworkChart({ byNetwork }: { byNetwork: AdStats['byNetwork'] }) {
  const data = byNetwork.map((item) => ({ ...item, label: AD_NETWORK_LABELS[item.network] ?? item.network }))
  return (
    <div className="h-56" role="img" aria-label="Bar chart: completed claims by ad network">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} horizontal={false} />
          <XAxis type="number" {...AXIS} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" {...AXIS} tickLine={false} axisLine={false} width={110} />
          <Tooltip {...TOOLTIP} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Bar
            dataKey="claimsCompleted"
            name="Completed claims"
            fill="var(--series-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
