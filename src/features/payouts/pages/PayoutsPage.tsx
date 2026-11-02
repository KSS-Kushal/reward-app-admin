import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, HandCoins, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { CoinsDisplay, DateDisplay, Mono } from '@/components/common/display'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, ErrorState } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useRedeemOptions } from '@/features/redeem-options/api/hooks'
import { useListParams } from '@/hooks/use-list-params'
import { shortId } from '@/lib/format'
import { useCompletePayout, useFailPayout, usePayouts } from '../api/hooks'
import { PAYOUT_STATUSES, type Payout, type PayoutStatus } from '../types/payout.types'

const FILTER_KEYS = ['status'] as const
type Tab = PayoutStatus | 'all'
const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'all', label: 'All' },
]

function Copyable({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      <Mono className="max-w-44 truncate">{value}</Mono>
      <CopyButton value={value} />
    </span>
  )
}

export function PayoutsPage() {
  const { filters, page, limit, update } = useListParams(FILTER_KEYS)
  // The pending queue is the default view: that's where work happens.
  const tab: Tab =
    filters.status === 'all'
      ? 'all'
      : (PAYOUT_STATUSES as readonly string[]).includes(filters.status)
        ? (filters.status as PayoutStatus)
        : 'pending'
  const query = usePayouts({ status: tab === 'all' ? '' : tab, page, limit })
  const options = useRedeemOptions()
  const complete = useCompletePayout()
  const fail = useFailPayout()
  const [completing, setCompleting] = useState<Payout | null>(null)
  const [failing, setFailing] = useState<Payout | null>(null)
  const [providerReference, setProviderReference] = useState('')
  const [reason, setReason] = useState('')

  const optionNames = useMemo(
    () => new Map((options.data ?? []).map((option) => [option.id, option.name])),
    [options.data],
  )

  const columns = useMemo<ColumnDef<Payout, unknown>[]>(
    () => [
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ getValue }) => (
          <Link
            to={`/admin/users/${getValue() as string}`}
            className="font-mono text-xs text-primary hover:underline"
            title={getValue() as string}
          >
            {shortId(getValue() as string)}
          </Link>
        ),
      },
      {
        accessorKey: 'optionId',
        header: 'Method',
        cell: ({ getValue }) => optionNames.get(getValue() as string) ?? (getValue() as string),
      },
      {
        accessorKey: 'coins',
        header: 'Coins',
        cell: ({ getValue }) => (
          <CoinsDisplay value={getValue() as number} className="font-medium whitespace-nowrap" />
        ),
      },
      {
        accessorKey: 'accountDetails',
        header: 'Account',
        cell: ({ getValue }) => <Copyable value={getValue() as string | null} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row: { original } }) => (
          <div className="space-y-1">
            <StatusBadge status={original.status} />
            {original.failureReason && (
              <p className="max-w-40 text-xs text-muted-foreground">{original.failureReason}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ getValue }) => <Copyable value={getValue() as string} />,
      },
      {
        accessorKey: 'providerReference',
        header: 'Provider ref',
        cell: ({ getValue }) => <Copyable value={getValue() as string | null} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Requested',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        accessorKey: 'processedAt',
        header: 'Processed',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string | null} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'text-right' },
        cell: ({ row: { original } }) =>
          original.status === 'pending' ? (
            <div className="flex justify-end gap-1.5">
              <Button size="sm" onClick={() => setCompleting(original)}>
                <CheckCircle2 /> Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setFailing(original)}
              >
                <XCircle /> Fail
              </Button>
            </div>
          ) : null,
      },
    ],
    [optionNames],
  )

  const closeComplete = () => {
    setCompleting(null)
    setProviderReference('')
  }
  const closeFail = () => {
    setFailing(null)
    setReason('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Redemption requests from users, oldest first. Pay them out, then mark them completed or failed."
      />

      <Tabs value={tab} onValueChange={(value) => update({ status: value === 'pending' ? '' : value })}>
        <TabsList>
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
              {item.value === tab && query.data && (
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                  ({query.data.totalItems})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.items}
            isLoading={query.isLoading}
            isFetching={query.isPlaceholderData}
            getRowId={(payout) => payout.id}
            caption="Payouts"
            emptyState={
              <EmptyState
                icon={HandCoins}
                title={tab === 'pending' ? 'No pending payouts' : 'No payouts found'}
                description={
                  tab === 'pending'
                    ? 'All redemption requests have been processed.'
                    : 'Nothing matches this filter yet.'
                }
              />
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

      <ConfirmDialog
        open={completing !== null}
        onOpenChange={(open) => !open && closeComplete()}
        title="Complete payout"
        description={
          <p>
            Confirm you've sent{' '}
            <span className="font-medium text-foreground">
              <CoinsDisplay value={completing?.coins} />
            </span>{' '}
            worth to <Mono>{completing?.accountDetails ?? 'the user'}</Mono>. A payout can only be settled
            once.
          </p>
        }
        confirmLabel="Mark as completed"
        pending={complete.isPending}
        confirmDisabled={!providerReference.trim()}
        onConfirm={() =>
          completing &&
          complete.mutateAsync({ id: completing.id, providerReference: providerReference.trim() })
        }
      >
        <div className="space-y-2">
          <Label htmlFor="provider-reference">Provider reference</Label>
          <Input
            id="provider-reference"
            value={providerReference}
            onChange={(event) => setProviderReference(event.target.value)}
            maxLength={120}
            placeholder="e.g. UTR123456"
            className="font-mono"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            The transaction id from your bank or payout provider.
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={failing !== null}
        onOpenChange={(open) => !open && closeFail()}
        title="Fail payout?"
        description={
          <p>
            The{' '}
            <span className="font-medium text-foreground">
              <CoinsDisplay value={failing?.coins} />
            </span>{' '}
            will be returned to the user's wallet. A payout can only be settled once.
          </p>
        }
        confirmLabel="Fail payout"
        destructive
        pending={fail.isPending}
        confirmDisabled={!reason.trim()}
        onConfirm={() => failing && fail.mutateAsync({ id: failing.id, reason: reason.trim() })}
      >
        <div className="space-y-2">
          <Label htmlFor="fail-reason">Reason</Label>
          <Textarea
            id="fail-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={255}
            rows={3}
            placeholder="e.g. Invalid UPI ID"
          />
          <p className="text-xs text-muted-foreground">
            Saved with the payout and recorded in the audit log.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
