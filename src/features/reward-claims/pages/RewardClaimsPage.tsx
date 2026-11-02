import type { ColumnDef } from '@tanstack/react-table'
import { differenceInDays, parseISO } from 'date-fns'
import { BadgeCheck, CircleSlash, Eye, Gift, HandCoins } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateRangeFilter } from '@/components/common/DateRangeFilter'
import { CoinsDisplay, DateDisplay, DetailList, Mono } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AD_NETWORK_LABELS, CLAIM_SOURCE_LABELS } from '@/features/ads/types/ads.types'
import { UserPicker } from '@/features/users/components/UserPicker'
import { useListParams } from '@/hooks/use-list-params'
import { useCompleteClaimManually, useRewardClaims } from '../api/hooks'
import {
  CLAIM_SOURCES,
  CLAIM_STATUSES,
  MANUAL_CREDIT_MAX_AGE_DAYS,
  type ClaimSource,
  type ClaimStatus,
  type RewardClaim,
} from '../types/reward-claim.types'

const FILTER_KEYS = ['userId', 'status', 'source', 'adVerified', 'from', 'to'] as const
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
]
const SOURCE_OPTIONS = CLAIM_SOURCES.map((value) => ({ value, label: CLAIM_SOURCE_LABELS[value] ?? value }))
const VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified ad' },
  { value: 'false', label: 'Not verified' },
]
const REASON_MIN = 5
const REASON_MAX = 500

/** Mirrors the backend rule; the server still decides (422 CLAIM_TOO_OLD). */
function canCreditManually(claim: RewardClaim): boolean {
  if (claim.status === 'pending') return true
  if (claim.status !== 'expired') return false
  return differenceInDays(new Date(), parseISO(claim.createdAt)) < MANUAL_CREDIT_MAX_AGE_DAYS
}

function Verified({ claim }: { claim: RewardClaim }) {
  return claim.adVerified ? (
    <span className="inline-flex items-center gap-1 text-success">
      <BadgeCheck className="size-4" aria-hidden /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <CircleSlash className="size-4" aria-hidden /> No
      {claim.notVerifiedAttempts > 0 && (
        <span className="text-xs">({claim.notVerifiedAttempts} retries)</span>
      )}
    </span>
  )
}

function ClaimDetails({ claim }: { claim: RewardClaim }) {
  const mono = (value: string | null) =>
    value ? (
      <span className="inline-flex items-center gap-1">
        <Mono className="max-w-56 truncate">{value}</Mono>
        <CopyButton value={value} />
      </span>
    ) : (
      '—'
    )
  return (
    <DetailList
      items={[
        { label: 'Claim id', value: mono(claim.claimId) },
        {
          label: 'User',
          value: claim.user ? (
            <Link to={`/admin/users/${claim.user.id}`} className="text-primary hover:underline">
              {claim.user.name} ({claim.user.email})
            </Link>
          ) : (
            '—'
          ),
        },
        { label: 'Source', value: CLAIM_SOURCE_LABELS[claim.source] ?? claim.source },
        { label: 'Coins', value: <CoinsDisplay value={claim.coins} /> },
        { label: 'Status', value: <StatusBadge status={claim.status} /> },
        { label: 'Ad verified', value: <Verified claim={claim} /> },
        {
          label: 'Ad network',
          value: claim.adNetwork ? (AD_NETWORK_LABELS[claim.adNetwork] ?? claim.adNetwork) : '—',
        },
        { label: 'Ad unit', value: mono(claim.adUnitId) },
        { label: 'Placement', value: claim.placement ?? '—' },
        { label: 'Ad transaction', value: mono(claim.adTransactionId) },
        { label: 'Wallet transaction', value: mono(claim.transactionId) },
        { label: 'Created', value: <DateDisplay value={claim.createdAt} /> },
        { label: 'Completed', value: <DateDisplay value={claim.completedAt} /> },
        { label: 'Expires', value: <DateDisplay value={claim.expiresAt} /> },
        ...(claim.manualReason
          ? [
              { label: 'Credited by admin', value: claim.completedBy ?? '—' },
              { label: 'Reason', value: claim.manualReason },
            ]
          : []),
      ]}
    />
  )
}

export function RewardClaimsPage() {
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const status = (CLAIM_STATUSES as readonly string[]).includes(filters.status)
    ? (filters.status as ClaimStatus)
    : ''
  const source = (CLAIM_SOURCES as readonly string[]).includes(filters.source)
    ? (filters.source as ClaimSource)
    : ''
  const adVerified = filters.adVerified === 'true' || filters.adVerified === 'false' ? filters.adVerified : ''
  const query = useRewardClaims({
    userId: filters.userId,
    status,
    source,
    adVerified,
    from: filters.from,
    to: filters.to,
    page,
    limit,
  })
  const credit = useCompleteClaimManually()
  const [viewing, setViewing] = useState<RewardClaim | null>(null)
  const [crediting, setCrediting] = useState<RewardClaim | null>(null)
  const [reason, setReason] = useState('')
  const reasonLength = reason.trim().length

  const columns = useMemo<ColumnDef<RewardClaim, unknown>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        id: 'user',
        header: 'User',
        cell: ({ row: { original } }) =>
          original.user ? (
            <Link to={`/admin/users/${original.user.id}`} className="block min-w-40 hover:underline">
              <span className="block truncate font-medium">{original.user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{original.user.email}</span>
            </Link>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ getValue }) => CLAIM_SOURCE_LABELS[getValue() as string] ?? (getValue() as string),
      },
      {
        accessorKey: 'coins',
        header: 'Coins',
        cell: ({ getValue }) => <CoinsDisplay value={getValue() as number} className="whitespace-nowrap" />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        id: 'verified',
        header: 'Ad verified',
        cell: ({ row: { original } }) => <Verified claim={original} />,
      },
      {
        accessorKey: 'adNetwork',
        header: 'Network',
        cell: ({ getValue }) => {
          const network = getValue() as string | null
          return network ? (
            (AD_NETWORK_LABELS[network] ?? network)
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string | null} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label="Claim actions"
            actions={[
              { label: 'View details', icon: Eye, onSelect: () => setViewing(original) },
              {
                label: 'Credit manually',
                icon: HandCoins,
                hidden: !canCreditManually(original),
                onSelect: () => setCrediting(original),
                separated: true,
              },
            ]}
          />
        ),
      },
    ],
    [],
  )

  const closeCredit = () => {
    setCrediting(null)
    setReason('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reward Claims"
        description="Check-in, spin and scratch prizes waiting for (or credited after) a rewarded ad. Use it for “I watched the ad but got no coins” tickets."
      />
      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <UserPicker value={filters.userId || null} onChange={(userId) => update({ userId })} />
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={status}
          onChange={(value) => update({ status: value })}
          options={STATUS_OPTIONS}
          className="sm:w-36"
        />
        <FilterSelect
          label="Source"
          allLabel="All sources"
          value={source}
          onChange={(value) => update({ source: value })}
          options={SOURCE_OPTIONS}
          className="sm:w-40"
        />
        <FilterSelect
          label="Ad verification"
          allLabel="Verified or not"
          value={adVerified}
          onChange={(value) => update({ adVerified: value })}
          options={VERIFIED_OPTIONS}
          className="sm:w-40"
        />
        <DateRangeFilter
          idPrefix="claims"
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
            getRowId={(claim) => claim.claimId}
            onRowClick={setViewing}
            caption="Reward claims"
            emptyState={
              hasFilters ? (
                <NoResults what="claims" onClear={clear} />
              ) : (
                <EmptyState
                  icon={Gift}
                  title="No reward claims yet"
                  description="Claims appear when users check in, spin or scratch in the app."
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Reward claim</DialogTitle>
            <DialogDescription>Everything recorded for this prize.</DialogDescription>
          </DialogHeader>
          {viewing && <ClaimDetails claim={viewing} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={crediting !== null}
        onOpenChange={(open) => !open && closeCredit()}
        title="Credit this reward manually?"
        description={
          <>
            <p>
              <span className="font-medium text-foreground">
                <CoinsDisplay value={crediting?.coins} />
              </span>{' '}
              go to {crediting?.user?.name ?? 'the user'} without ad verification
              {crediting?.source === 'checkIn' ? ', and the check-in counts toward their streak' : ''}.
            </p>
            <p>
              Use this only when the ad was really watched (for example during a network outage). It's
              recorded with your name.
            </p>
          </>
        }
        confirmLabel="Credit coins"
        pending={credit.isPending}
        confirmDisabled={reasonLength < REASON_MIN || reasonLength > REASON_MAX}
        onConfirm={() =>
          crediting && credit.mutateAsync({ claimId: crediting.claimId, reason: reason.trim() })
        }
      >
        <div className="space-y-2">
          <Label htmlFor="credit-reason">Reason</Label>
          <Textarea
            id="credit-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={REASON_MAX}
            rows={3}
            placeholder="e.g. AdMob SSV outage 24 Oct, user ticket #1832"
          />
          <p className="text-xs text-muted-foreground">
            Required, {REASON_MIN}–{REASON_MAX} characters. Recorded in the audit log.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
