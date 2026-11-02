import { AlertTriangle, CheckCircle2, Coins, Percent, ShieldX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'
import { verificationLooksBroken } from '../schemas/ad-settings.schema'
import type { AdStats } from '../types/ads.types'

function Tile({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardDescription className="flex items-center justify-between">
          {label}
          <Icon className="size-4" aria-hidden />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export function AdStatTiles({ stats, loading }: { stats: AdStats | undefined; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    )
  }
  const { totals } = stats
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Claims completed"
          value={formatNumber(totals.claimsCompleted)}
          icon={CheckCircle2}
          hint={`of ${formatNumber(totals.claimsCreated)} created`}
        />
        <Tile
          label="Completion rate"
          value={`${(totals.completionRate * 100).toFixed(1)}%`}
          icon={Percent}
          hint={`${formatNumber(totals.claimsExpired)} expired uncollected`}
        />
        <Tile
          label="Coins credited"
          value={formatNumber(totals.coinsCredited)}
          icon={Coins}
          hint="Through rewarded ads"
        />
        <Tile
          label="Rejected callbacks"
          value={formatNumber(totals.callbacksRejected)}
          icon={ShieldX}
          hint={`of ${formatNumber(totals.callbacksReceived)} received`}
        />
      </div>
      {verificationLooksBroken(totals) && (
        <p className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-warning/50 bg-warning/10 px-3 py-1 text-sm">
          <AlertTriangle className="size-4 text-warning" aria-hidden />
          {formatNumber(totals.notVerifiedResponses)} collect attempts couldn't be verified. The ad callbacks
          may be misconfigured;{' '}
          <Link to="/admin/ads/callbacks?result=rejected" className="font-medium underline">
            check the callback log
          </Link>
          .
        </p>
      )}
    </div>
  )
}
