import type { ColumnDef } from '@tanstack/react-table'
import { Ban, Eye, ShieldCheck, ShieldOff, UserCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateDisplay, Mono } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuth } from '@/features/auth/context/auth-context'
import { useListParams } from '@/hooks/use-list-params'
import { useUsers } from '../api/queries'
import { UserActionDialogs, type UserAction } from '../components/UserActionDialogs'
import { UserAvatar } from '../components/UserAvatar'
import type { AdminUser, UserStatus } from '../types/user.types'

const FILTER_KEYS = ['q', 'status'] as const
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BANNED', label: 'Banned' },
]

export function UsersPage() {
  const navigate = useNavigate()
  const { admin } = useAuth()
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const status =
    filters.status === 'ACTIVE' || filters.status === 'BANNED' ? (filters.status as UserStatus) : ''
  const query = useUsers({ q: filters.q, status, page, limit })
  const [action, setAction] = useState<UserAction>(null)

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        id: 'user',
        header: 'User',
        accessorFn: (user) => user.name,
        cell: ({ row: { original: user } }) => (
          <div className="flex min-w-48 items-center gap-3">
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium">
                {user.name}
                {user.id === admin?.id && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) =>
          (getValue() as string | null) ?? <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'referralCode',
        header: 'Referral code',
        cell: ({ getValue }) => <Mono>{getValue() as string}</Mono>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last login',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string | null} mode="relative" />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original: user } }) => {
          const self = user.id === admin?.id
          return (
            <RowActions
              label={`Actions for ${user.name}`}
              actions={[
                { label: 'View details', icon: Eye, onSelect: () => navigate(`/admin/users/${user.id}`) },
                {
                  label: user.role === 'ADMIN' ? 'Remove admin' : 'Make admin',
                  icon: user.role === 'ADMIN' ? ShieldOff : ShieldCheck,
                  onSelect: () => setAction({ type: 'role', user }),
                  disabled: self,
                  separated: true,
                },
                user.status === 'BANNED'
                  ? {
                      label: 'Unban user',
                      icon: UserCheck,
                      onSelect: () => setAction({ type: 'unban', user }),
                    }
                  : {
                      label: 'Ban user',
                      icon: Ban,
                      onSelect: () => setAction({ type: 'ban', user }),
                      destructive: true,
                      disabled: self,
                    },
              ]}
            />
          )
        },
      },
    ],
    [admin?.id, navigate],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Search app users, review their wallets and manage access." />

      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <SearchInput
          value={filters.q}
          onChange={(q) => update({ q })}
          placeholder="Search name, email or referral code"
        />
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={status}
          onChange={(value) => update({ status: value })}
          options={STATUS_OPTIONS}
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
            getRowId={(user) => user.id}
            onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
            caption="Users"
            emptyState={
              hasFilters ? (
                <NoResults what="users" onClear={clear} />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No users yet"
                  description="Users appear here after they sign in to the app."
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

      <UserActionDialogs action={action} onClose={() => setAction(null)} />
    </div>
  )
}
