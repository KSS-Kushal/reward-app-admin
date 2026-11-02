import { Settings2 } from 'lucide-react'
import { Link } from 'react-router'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateRangeFilter } from '@/components/common/DateRangeFilter'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useListParams } from '@/hooks/use-list-params'
import { formatDate, formatNumber } from '@/lib/format'
import { useAdStats } from '../api/hooks'
import {
  ClaimsBySourceChart,
  ClaimsOverTimeChart,
  CompletedByNetworkChart,
} from '../components/AdStatsCharts'
import { AdStatTiles } from '../components/AdStatTiles'
import { AD_NETWORK_LABELS, CLAIM_SOURCE_LABELS } from '../types/ads.types'

const FILTER_KEYS = ['from', 'to'] as const

export function AdsOverviewPage() {
  const { filters, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const query = useAdStats({ from: filters.from, to: filters.to })
  const stats = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ads Overview"
        description={
          stats
            ? `Rewarded-ad claims and callback verification, ${formatDate(stats.from)} – ${formatDate(stats.to)}. Impression revenue lives in the AdMob and Unity dashboards.`
            : 'Rewarded-ad claims and callback verification.'
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/ads/settings">
              <Settings2 /> Ad settings
            </Link>
          </Button>
        }
      />

      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <DateRangeFilter
          idPrefix="ad-stats"
          from={filters.from}
          to={filters.to}
          onChange={(range) => update(range)}
        />
        {!hasFilters && <span className="text-sm text-muted-foreground">Default: last 7 days</span>}
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className={query.isPlaceholderData ? 'space-y-6 opacity-60' : 'space-y-6'}>
          <AdStatTiles stats={stats} loading={query.isLoading} />

          <Card>
            <CardHeader>
              <CardTitle>Claims per day</CardTitle>
              <CardDescription>
                Prizes created (check-in, spin, scratch) vs collected after a rewarded ad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? <ClaimsOverTimeChart series={stats.series} /> : <Skeleton className="h-72" />}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completed claims by network</CardTitle>
                <CardDescription>Should roughly follow the share set in Ad Settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    <CompletedByNetworkChart byNetwork={stats.byNetwork} />
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Network</TableHead>
                          <TableHead className="text-right">Completed</TableHead>
                          <TableHead className="text-right">Callbacks</TableHead>
                          <TableHead className="text-right">Rejected</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.byNetwork.map((row) => (
                          <TableRow key={row.network}>
                            <TableCell>{AD_NETWORK_LABELS[row.network] ?? row.network}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.claimsCompleted)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.callbacksReceived)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.callbacksRejected)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <Skeleton className="h-56" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Claims by source</CardTitle>
                <CardDescription>Which rewards users collect, and which they leave.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    <ClaimsBySourceChart bySource={stats.bySource} />
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Created</TableHead>
                          <TableHead className="text-right">Completed</TableHead>
                          <TableHead className="text-right">Coins</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.bySource.map((row) => (
                          <TableRow key={row.source}>
                            <TableCell>{CLAIM_SOURCE_LABELS[row.source] ?? row.source}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.claimsCreated)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.claimsCompleted)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(row.coinsCredited)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <Skeleton className="h-56" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
