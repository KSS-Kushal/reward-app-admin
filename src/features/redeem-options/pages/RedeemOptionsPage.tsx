import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { CoinsDisplay, Mono } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { EntityDialog } from '@/components/crud/EntityDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useCreateRedeemOption,
  useDeleteRedeemOption,
  useRedeemOptions,
  useUpdateRedeemOption,
} from '../api/hooks'
import { RedeemOptionForm } from '../components/RedeemOptionForm'
import { REDEEM_METHOD_LABELS, type RedeemOption } from '../types/redeem-option.types'

export function RedeemOptionsPage() {
  const query = useRedeemOptions()
  const create = useCreateRedeemOption()
  const update = useUpdateRedeemOption()
  const remove = useDeleteRedeemOption()
  const [editing, setEditing] = useState<RedeemOption | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<RedeemOption | null>(null)

  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [query.data])
  const nextSortOrder = rows.length ? rows[rows.length - 1]!.sortOrder + 1 : 0

  const columns = useMemo<ColumnDef<RedeemOption, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Payout method',
        cell: ({ row: { original } }) => (
          <div className="min-w-52">
            <p className="font-medium">{original.name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: 'method',
        header: 'Type',
        cell: ({ row: { original } }) => (
          <Badge variant="secondary">{REDEEM_METHOD_LABELS[original.method] ?? original.method}</Badge>
        ),
      },
      {
        accessorKey: 'minCoins',
        header: 'Minimum',
        cell: ({ getValue }) => <CoinsDisplay value={getValue() as number} className="whitespace-nowrap" />,
      },
      { accessorKey: 'processingTime', header: 'Processing' },
      {
        accessorKey: 'accountLabel',
        header: 'Account',
        cell: ({ row: { original } }) =>
          original.accountLabel ? (
            <span className="inline-flex flex-col gap-0.5">
              {original.accountLabel}
              {original.accountPattern && (
                <Mono className="max-w-40 truncate text-[10px]">{original.accountPattern}</Mono>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Not required</span>
          ),
      },
      {
        accessorKey: 'enabled',
        header: 'Status',
        cell: ({ getValue }) => (
          <BooleanBadge value={getValue() as boolean} trueLabel="Enabled" falseLabel="Disabled" />
        ),
      },
      { accessorKey: 'sortOrder', header: 'Sort', meta: { cellClassName: 'tabular-nums' } },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label={`Actions for ${original.name}`}
            actions={[
              { label: 'Edit', icon: Pencil, onSelect: () => setEditing(original) },
              {
                label: 'Delete',
                icon: Trash2,
                onSelect: () => setToDelete(original),
                destructive: true,
                separated: true,
              },
            ]}
          />
        ),
      },
    ],
    [],
  )

  const addButton = (
    <Button onClick={() => setEditing('new')}>
      <Plus /> Add redeem option
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redeem Options"
        description="Payout methods users can redeem their coins with."
        actions={addButton}
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          getRowId={(option) => option.id}
          onRowClick={setEditing}
          caption="Redeem options"
          emptyState={
            <EmptyState
              icon={Wallet}
              title="No redeem options yet"
              description="Users can't redeem coins until at least one payout method is enabled."
              action={addButton}
            />
          }
        />
      )}

      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'New redeem option' : 'Edit redeem option'}
        className="sm:max-w-2xl"
      >
        <RedeemOptionForm
          option={editing === 'new' || editing === null ? undefined : editing}
          nextSortOrder={nextSortOrder}
          pending={create.isPending || update.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={async (body) => {
            if (editing && editing !== 'new') await update.mutateAsync({ id: editing.id, body })
            else await create.mutateAsync(body)
            setEditing(null)
          }}
        />
      </EntityDialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete redeem option?"
        description={
          <p>
            Users will no longer be able to redeem with{' '}
            <span className="font-medium text-foreground">{toDelete?.name}</span>. Existing payouts are not
            affected.
          </p>
        }
        confirmLabel="Delete redeem option"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
