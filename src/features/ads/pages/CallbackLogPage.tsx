import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Webhook } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/common/CopyButton'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateRangeFilter } from '@/components/common/DateRangeFilter'
import { DateDisplay, Mono } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useListParams } from '@/hooks/use-list-params'
import { useAdCallbacks } from '../api/hooks'
import {
  AD_NETWORK_LABELS,
  CALLBACK_NETWORKS,
  CALLBACK_RESULTS,
  type AdCallback,
  type CallbackNetwork,
  type CallbackResult,
} from '../types/ads.types'

const FILTER_KEYS = ['network', 'result', 'from', 'to'] as const
const NETWORK_OPTIONS = CALLBACK_NETWORKS.map((value) => ({
  value,
  label: AD_NETWORK_LABELS[value] ?? value,
}))
const RESULT_OPTIONS = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'rejected', label: 'Rejected' },
]
const RESULT_BADGE: Record<CallbackResult, { status: string; label: string }> = {
  accepted: { status: 'COMPLETED', label: 'Accepted' },
  duplicate: { status: 'INACTIVE', label: 'Duplicate' },
  rejected: { status: 'FAILED', label: 'Rejected' },
}
const REASON_HINTS: Record<string, string> = {
  INVALID_SIGNATURE: 'Signature check failed (wrong secret or forged request).',
  UNKNOWN_CLAIM: 'No reward claim has this id.',
  CLAIM_NOT_PENDING: 'The claim was already completed or expired.',
  DUPLICATE: 'The network retried a callback it had already sent.',
  MISSING_SECRET: 'No Unity S2S secret is saved in Ad Settings.',
  MISSING_TRANSACTION_ID: 'The callback had no transaction id.',
}

export function CallbackLogPage() {
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const network = (CALLBACK_NETWORKS as readonly string[]).includes(filters.network)
    ? (filters.network as CallbackNetwork)
    : ''
  const result = (CALLBACK_RESULTS as readonly string[]).includes(filters.result)
    ? (filters.result as CallbackResult)
    : ''
  const query = useAdCallbacks({ network, result, from: filters.from, to: filters.to, page, limit })
  const [viewing, setViewing] = useState<AdCallback | null>(null)

  const columns = useMemo<ColumnDef<AdCallback, unknown>[]>(
    () => [
      {
        accessorKey: 'receivedAt',
        header: 'Received',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        accessorKey: 'network',
        header: 'Network',
        cell: ({ getValue }) => AD_NETWORK_LABELS[getValue() as string] ?? (getValue() as string),
      },
      {
        accessorKey: 'result',
        header: 'Result',
        cell: ({ getValue }) => {
          const badge = RESULT_BADGE[getValue() as CallbackResult]
          return badge ? <StatusBadge status={badge.status} label={badge.label} /> : String(getValue())
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ getValue }) => {
          const reason = getValue() as string | null
          return reason ? (
            <span title={REASON_HINTS[reason]} className="font-mono text-xs">
              {reason}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: 'claimId',
        header: 'Claim',
        cell: ({ getValue }) => {
          const id = getValue() as string | null
          return id ? (
            <span className="inline-flex items-center gap-1">
              <Mono className="max-w-32 truncate">{id}</Mono>
              <CopyButton value={id} label="Copy claim id" />
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction',
        cell: ({ getValue }) => (
          <Mono className="max-w-36 truncate">{(getValue() as string | null) ?? '—'}</Mono>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Details</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setViewing(original)}
            aria-label="View raw callback"
          >
            <Eye />
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Callback Log"
        description="Server-to-server callbacks from AdMob and Unity that prove a rewarded ad was watched."
      />
      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <FilterSelect
          label="Network"
          allLabel="All networks"
          value={network}
          onChange={(value) => update({ network: value })}
          options={NETWORK_OPTIONS}
        />
        <FilterSelect
          label="Result"
          allLabel="All results"
          value={result}
          onChange={(value) => update({ result: value })}
          options={RESULT_OPTIONS}
        />
        <DateRangeFilter
          idPrefix="callbacks"
          from={filters.from}
          to={filters.to}
          onChange={(range) => update(range)}
        />
      </DataTableToolbar>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.items}
            isLoading={query.isLoading}
            isFetching={query.isPlaceholderData}
            getRowId={(callback) => String(callback.id)}
            getRowClassName={(callback) =>
              callback.result === 'rejected' ? 'bg-destructive/5 hover:bg-destructive/10' : undefined
            }
            caption="Ad callbacks"
            emptyState={
              hasFilters ? (
                <NoResults what="callbacks" onClear={clear} />
              ) : (
                <EmptyState
                  icon={Webhook}
                  title="No callbacks received yet"
                  description="Set the callback URLs from Ad Settings in the AdMob and Unity dashboards. Callbacks appear here as rewarded ads are watched."
                />
              )
            }
          />
          <Pagination
            page={query.data}
            onPageChange={(next) => update({ page: next })}
            onLimitChange={(next) => update({ limit: next })}
            disabled={query.isFetching}
          />
        </>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Callback #{viewing?.id}</DialogTitle>
            <DialogDescription>
              {viewing && (AD_NETWORK_LABELS[viewing.network] ?? viewing.network)} ·{' '}
              {viewing?.reason ? `${viewing.reason}: ${REASON_HINTS[viewing.reason] ?? ''}` : viewing?.result}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Raw query string</p>
              {viewing?.rawQuery && <CopyButton value={viewing.rawQuery} label="Copy raw query" />}
            </div>
            <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {viewing?.rawQuery ? viewing.rawQuery.split('&').join('\n&') : '—'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
