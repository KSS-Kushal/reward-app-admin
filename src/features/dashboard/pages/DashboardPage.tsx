import {
  Activity,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  FilePlus2,
  Gauge,
  HandCoins,
  ImagePlus,
  Megaphone,
  PackagePlus,
  Store,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CoinsDisplay, DateDisplay } from '@/components/common/display'
import { ErrorState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActionBadge } from '@/features/audit-log/components/ActionBadge'
import { entityLabel } from '@/features/audit-log/utils/entities'
import { useAuth } from '@/features/auth/context/auth-context'
import { useAdStats } from '@/features/ads/api/hooks'
import { AdStatTiles } from '@/features/ads/components/AdStatTiles'
import { useConfigEntries } from '@/features/configuration/api/hooks'
import { formatNumber, shortId } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePayoutOverview, useRecentActivity, useSystemHealth, useUserCounts } from '../api/queries'
import type { HealthStatus } from '../api/health.api'

function greeting(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  to,
  loading,
  tone,
}: {
  label: string
  value: number | undefined
  icon: LucideIcon
  hint?: ReactNode
  to: string
  loading: boolean
  tone?: 'warning' | 'danger'
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full gap-3 transition-colors group-hover:border-primary/40">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            {label}
            <Icon
              className={cn(
                'size-4',
                tone === 'warning' && 'text-warning',
                tone === 'danger' && 'text-destructive',
              )}
              aria-hidden
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(value)}</p>
          )}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}

const PAYOUT_SEGMENTS = [
  { key: 'pending', label: 'Pending', icon: Clock, bar: 'bg-warning' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, bar: 'bg-success' },
  { key: 'failed', label: 'Failed', icon: XCircle, bar: 'bg-destructive' },
] as const

function PayoutsCard() {
  const query = usePayoutOverview()
  const counts = query.data?.counts
  const oldestPending = query.data?.oldestPending ?? []
  const total = counts ? counts.pending + counts.completed + counts.failed : 0

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Payouts</CardTitle>
        <CardDescription>Redemption requests by status, and the oldest ones waiting.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/payouts">
              Open queue <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.isLoading || !counts ? (
          <Skeleton className="h-28" />
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3">
              {PAYOUT_SEGMENTS.map((segment) => (
                <div key={segment.key} className="rounded-lg border p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <segment.icon className="size-3.5" aria-hidden /> {segment.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatNumber(counts[segment.key])}
                  </dd>
                </div>
              ))}
            </dl>
            {total > 0 && (
              <div
                className="flex h-2 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={PAYOUT_SEGMENTS.map((s) => `${s.label} ${counts[s.key]}`).join(', ')}
              >
                {PAYOUT_SEGMENTS.filter((segment) => counts[segment.key] > 0).map((segment) => (
                  <div
                    key={segment.key}
                    className={cn('h-full first:rounded-l-full last:rounded-r-full', segment.bar)}
                    style={{ width: `${(counts[segment.key] / total) * 100}%` }}
                    title={`${segment.label}: ${formatNumber(counts[segment.key])} (${Math.round((counts[segment.key] / total) * 100)}%)`}
                  />
                ))}
              </div>
            )}
            <div>
              <p className="mb-2 text-sm font-medium">Oldest pending</p>
              {oldestPending.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-success" aria-hidden /> No payouts waiting. All caught
                  up.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {oldestPending.map((payout) => (
                    <li key={payout.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-mono text-xs">{payout.reference}</span>
                      <CoinsDisplay value={payout.coins} className="font-medium" />
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        <DateDisplay value={payout.createdAt} mode="relative" />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const QUICK_ACTIONS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Create article', to: '/admin/articles/new', icon: FilePlus2 },
  { label: 'Add banner', to: '/admin/banners/new', icon: Megaphone },
  { label: 'Add merchant', to: '/admin/merchants/new', icon: Store },
  { label: 'Add product', to: '/admin/products', icon: PackagePlus },
  { label: 'Upload media', to: '/admin/media', icon: ImagePlus },
  { label: 'Manage payouts', to: '/admin/payouts', icon: HandCoins },
  { label: 'Configure rewards', to: '/admin/config?tab=rewards', icon: Gauge },
]

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto justify-start py-2.5 whitespace-normal"
            asChild
          >
            <Link to={action.to}>
              <action.icon className="text-primary" />
              <span className="text-left">{action.label}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  const { admin } = useAuth()
  const query = useRecentActivity()
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent admin activity</CardTitle>
        <CardDescription>The latest changes from the audit log.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/audit-log">
              View all <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
        ) : query.data?.items.length ? (
          <ol className="relative space-y-4 border-l pl-5">
            {query.data.items.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <ActionBadge action={entry.action} />
                  <span className="font-medium">{entityLabel(entry.entityType)}</span>
                  <span className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                    {entry.entityId}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.adminId === admin?.id ? 'You' : `Admin ${shortId(entry.adminId)}`} ·{' '}
                  <DateDisplay value={entry.createdAt} mode="relative" />
                  {entry.summary && <span className="line-clamp-1 break-all"> · {entry.summary}</span>}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No admin changes recorded yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

const HEALTH_LABELS: Record<HealthStatus, { label: string; icon: LucideIcon; className: string }> = {
  UP: { label: 'Operational', icon: CheckCircle2, className: 'text-success' },
  DOWN: { label: 'Down', icon: XCircle, className: 'text-destructive' },
  UNREACHABLE: { label: 'Not reachable', icon: Ban, className: 'text-muted-foreground' },
}

function HealthRow({ label, status, loading }: { label: string; status?: HealthStatus; loading: boolean }) {
  const config = status ? HEALTH_LABELS[status] : null
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span>{label}</span>
      {loading || !config ? (
        <Skeleton className="h-4 w-24" />
      ) : (
        <span className={cn('inline-flex items-center gap-1.5 font-medium', config.className)}>
          <config.icon className="size-4" aria-hidden /> {config.label}
        </span>
      )}
    </div>
  )
}

function SystemStatus() {
  const health = useSystemHealth()
  const config = useConfigEntries()
  const value = (key: string) =>
    config.data?.find((entry) => entry.key === key)?.value as Record<string, unknown> | undefined
  const wallet = value('wallet')
  const signup = value('signup')
  const referral = value('referral')
  const asNumber = (input: unknown) => (typeof input === 'number' ? input : undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" /> System status
        </CardTitle>
        <CardDescription>From the API health endpoints, checked every minute.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y">
          <HealthRow label="API" status={health.data?.api} loading={health.isLoading} />
          <HealthRow label="Database & Redis" status={health.data?.readiness} loading={health.isLoading} />
        </div>
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Economy at a glance</p>
          {config.isLoading ? (
            <Skeleton className="h-16" />
          ) : config.isError ? (
            <p className="text-sm text-muted-foreground">Configuration unavailable.</p>
          ) : (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Conversion</dt>
                <dd className="tabular-nums">
                  {formatNumber(asNumber(wallet?.coinsPerCurrencyUnit))} coins ={' '}
                  {String(wallet?.currencySymbol ?? '')}1
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Minimum redemption</dt>
                <dd>
                  <CoinsDisplay value={asNumber(wallet?.minRedeemCoins)} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Welcome bonus</dt>
                <dd>
                  <CoinsDisplay value={asNumber(signup?.welcomeBonus)} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Referral reward</dt>
                <dd>
                  <CoinsDisplay value={asNumber(referral?.rewardPerReferral)} />
                </dd>
              </div>
            </dl>
          )}
          <Button variant="link" size="sm" className="h-auto px-0" asChild>
            <Link to="/admin/config?tab=economy">Edit configuration</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AdsSummary() {
  const stats = useAdStats({})
  return (
    <section aria-labelledby="ads-summary" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="ads-summary" className="text-base font-semibold">
          Rewarded ads · last 7 days
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/ads">
            Ads overview <ArrowRight />
          </Link>
        </Button>
      </div>
      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : (
        <AdStatTiles stats={stats.data} loading={stats.isLoading} />
      )}
    </section>
  )
}

export function DashboardPage() {
  const { admin } = useAuth()
  const users = useUserCounts()
  const payouts = usePayoutOverview()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {admin?.name.split(' ')[0] ?? 'admin'}
        </h1>
        <p className="text-sm text-muted-foreground">Here's what needs your attention on Kavodnik today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Users"
          value={users.data?.total}
          icon={Users}
          to="/admin/users"
          loading={users.isLoading}
          hint="All registered accounts"
        />
        <StatTile
          label="Banned users"
          value={users.data?.banned}
          icon={Ban}
          to="/admin/users?status=BANNED"
          loading={users.isLoading}
          tone="danger"
          hint="Can't sign in or earn"
        />
        <StatTile
          label="Pending payouts"
          value={payouts.data?.counts.pending}
          icon={HandCoins}
          to="/admin/payouts"
          loading={payouts.isLoading}
          tone="warning"
          hint="Waiting to be paid out"
        />
      </div>

      <AdsSummary />

      <div className="grid gap-6 lg:grid-cols-3">
        <PayoutsCard />
        <QuickActions />
        <RecentActivity />
        <SystemStatus />
      </div>
    </div>
  )
}
