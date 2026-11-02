import type { ColumnDef } from '@tanstack/react-table'
import { ScrollText } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateDisplay, Mono } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { useAuth } from '@/features/auth/context/auth-context'
import { useListParams } from '@/hooks/use-list-params'
import { shortId } from '@/lib/format'
import { useAuditLog, type AuditEntry } from '../api/audit.api'
import { ActionBadge } from '../components/ActionBadge'
import { AUDIT_ENTITY_TYPES, entityLabel, entityLink } from '../utils/entities'

const FILTER_KEYS = ['entityType'] as const
const ENTITY_OPTIONS = AUDIT_ENTITY_TYPES.map(({ value, label }) => ({ value, label }))

export function AuditLogPage() {
  const { admin } = useAuth()
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const query = useAuditLog({ entityType: filters.entityType, page, limit })

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        accessorKey: 'adminId',
        header: 'Admin',
        cell: ({ getValue }) => {
          const id = getValue() as string
          return id === admin?.id ? (
            <span className="font-medium">You</span>
          ) : (
            <Link
              to={`/admin/users/${id}`}
              className="font-mono text-xs text-primary hover:underline"
              title={id}
            >
              {shortId(id)}
            </Link>
          )
        },
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ getValue }) => <ActionBadge action={getValue() as string} />,
      },
      {
        accessorKey: 'entityType',
        header: 'Entity',
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap">{entityLabel(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'entityId',
        header: 'Entity ID',
        cell: ({ row: { original } }) => {
          const link = entityLink(original.entityType, original.entityId, original.action)
          const label = (
            <Mono className="max-w-40 truncate">
              {original.entityId.length > 24 ? shortId(original.entityId) : original.entityId}
            </Mono>
          )
          return link ? (
            <Link to={link} title={original.entityId} className="hover:underline">
              {label}
            </Link>
          ) : (
            <span title={original.entityId}>{label}</span>
          )
        },
      },
      {
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({ getValue }) => {
          const summary = getValue() as string | null
          return summary ? (
            <p className="line-clamp-2 max-w-md text-sm break-all" title={summary}>
              {summary}
            </p>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
    ],
    [admin?.id],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Every change made by admins, newest first. Read-only." />
      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <FilterSelect
          label="Entity type"
          allLabel="All entities"
          value={filters.entityType}
          onChange={(entityType) => update({ entityType })}
          options={ENTITY_OPTIONS}
          className="sm:w-52"
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
            getRowId={(entry) => entry.id}
            caption="Audit log"
            emptyState={
              hasFilters ? (
                <NoResults what="entries" onClear={clear} />
              ) : (
                <EmptyState
                  icon={ScrollText}
                  title="No admin activity yet"
                  description="Changes made in the admin panel appear here."
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
    </div>
  )
}
