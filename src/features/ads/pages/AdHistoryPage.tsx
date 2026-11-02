import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, History, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { DateDisplay, Mono } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, ErrorState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useListParams } from '@/hooks/use-list-params'
import { useAdSettings, useAdSettingsHistory, useRestoreAdSettings } from '../api/hooks'
import type { AdSettingsChange, AdSettingsHistoryItem } from '../types/ads.types'

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function Changes({ changes }: { changes: AdSettingsChange[] }) {
  if (changes.length === 0) return <span className="text-muted-foreground">No changes</span>
  return (
    <ul className="space-y-1">
      {changes.slice(0, 8).map((change) => (
        <li key={change.field} className="flex flex-wrap items-center gap-1.5 text-xs">
          <Mono>{change.field}</Mono>
          <span
            className="max-w-48 truncate text-muted-foreground line-through"
            title={formatValue(change.from)}
          >
            {formatValue(change.from)}
          </span>
          <ArrowRight className="size-3 text-muted-foreground" aria-label="changed to" />
          <span className="max-w-48 truncate font-medium" title={formatValue(change.to)}>
            {formatValue(change.to)}
          </span>
        </li>
      ))}
      {changes.length > 8 && <li className="text-xs text-muted-foreground">+{changes.length - 8} more</li>}
    </ul>
  )
}

export function AdHistoryPage() {
  const { page, limit, update } = useListParams([] as const)
  const query = useAdSettingsHistory({ page, limit })
  const current = useAdSettings()
  const restore = useRestoreAdSettings()
  const [toRestore, setToRestore] = useState<AdSettingsHistoryItem | null>(null)
  const currentVersion = current.data?.version

  const columns = useMemo<ColumnDef<AdSettingsHistoryItem, unknown>[]>(
    () => [
      {
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row: { original } }) => (
          <span className="inline-flex items-center gap-2 font-medium tabular-nums">
            v{original.version}
            {original.version === currentVersion && <Badge variant="secondary">Current</Badge>}
          </span>
        ),
      },
      {
        accessorKey: 'changedAt',
        header: 'Date',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      { id: 'admin', header: 'Admin', cell: ({ row: { original } }) => original.changedBy?.name ?? '—' },
      {
        accessorKey: 'note',
        header: 'Note',
        cell: ({ getValue }) => (
          <span className="block max-w-56 text-sm">{(getValue() as string | null) ?? '—'}</span>
        ),
      },
      {
        id: 'changes',
        header: 'Changes',
        cell: ({ row: { original } }) => <Changes changes={original.changes} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'text-right' },
        cell: ({ row: { original } }) =>
          original.version === currentVersion ? null : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setToRestore(original)}
              disabled={currentVersion === undefined}
            >
              <RotateCcw /> Restore
            </Button>
          ),
      },
    ],
    [currentVersion],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Settings History"
        description="Every saved version of the ad settings, newest first."
        backTo="/admin/ads/settings"
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.items}
            isLoading={query.isLoading}
            isFetching={query.isPlaceholderData}
            getRowId={(item) => String(item.version)}
            caption="Ad settings history"
            emptyState={
              <EmptyState
                icon={History}
                title="No history yet"
                description="Each save of the ad settings appears here."
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
        open={toRestore !== null}
        onOpenChange={(open) => !open && setToRestore(null)}
        title={`Restore version ${toRestore?.version}?`}
        description={
          <>
            <p>
              Its settings are saved as a new version (v{(currentVersion ?? 0) + 1}). The current Unity S2S
              secret is kept.
            </p>
            <p>Users get the change the next time they open the app.</p>
          </>
        }
        confirmLabel="Restore version"
        pending={restore.isPending}
        onConfirm={() =>
          toRestore &&
          currentVersion !== undefined &&
          restore.mutateAsync({ version: toRestore.version, currentVersion })
        }
      />
    </div>
  )
}
