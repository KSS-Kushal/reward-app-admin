import type { ColumnDef } from '@tanstack/react-table'
import { ExternalLink, Megaphone, Pencil, Plus, Route, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { Mono } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useListParams } from '@/hooks/use-list-params'
import { formatDateTime } from '@/lib/format'
import { useDeleteBanner } from '../api/mutations'
import { useBanners } from '../api/queries'
import { BannerPreview } from '../components/BannerPreview'
import { bannerScheduleState, type ScheduleState } from '../schemas/banner.schema'
import type { Banner } from '../types/banner.types'

const FILTER_KEYS = ['q', 'state'] as const
const STATE_OPTIONS: { value: ScheduleState; label: string }[] = [
  { value: 'ACTIVE', label: 'Live now' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'INACTIVE', label: 'Inactive' },
]
const STATE_LABELS: Record<ScheduleState, string> = {
  ACTIVE: 'Live',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
  INACTIVE: 'Inactive',
}

function Schedule({ banner }: { banner: Banner }) {
  if (!banner.startsAt && !banner.endsAt) return <span className="text-muted-foreground">Always</span>
  return (
    <div className="space-y-0.5 text-xs">
      <p>
        <span className="text-muted-foreground">From </span>
        {banner.startsAt ? formatDateTime(banner.startsAt) : 'now'}
      </p>
      <p>
        <span className="text-muted-foreground">Until </span>
        {banner.endsAt ? formatDateTime(banner.endsAt) : 'no end'}
      </p>
    </div>
  )
}

export function BannersPage() {
  const navigate = useNavigate()
  const query = useBanners()
  const remove = useDeleteBanner()
  const [toDelete, setToDelete] = useState<Banner | null>(null)
  // The banner list isn't paginated by the API, so search and status filter run on the loaded list.
  const { filters, update, clear, hasFilters } = useListParams(FILTER_KEYS)

  const rows = useMemo(() => {
    const term = filters.q.toLowerCase()
    return (query.data ?? []).filter(
      (banner) =>
        (!term || banner.title.toLowerCase().includes(term) || banner.id.includes(term)) &&
        (!filters.state || bannerScheduleState(banner) === filters.state),
    )
  }, [query.data, filters.q, filters.state])

  const columns = useMemo<ColumnDef<Banner, unknown>[]>(
    () => [
      {
        id: 'banner',
        header: 'Banner',
        accessorFn: (banner) => banner.title,
        cell: ({ row: { original: banner } }) => (
          <div className="flex min-w-64 items-center gap-3">
            <BannerPreview
              compact
              title={banner.title}
              imageUrl={banner.imageUrl}
              gradient={banner.gradient}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{banner.title}</p>
              <p className="truncate text-xs text-muted-foreground">{banner.subtitle ?? banner.id}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row: { original: banner } }) =>
          banner.actionRoute ? (
            <span className="inline-flex items-center gap-1.5">
              <Route className="size-3.5 text-muted-foreground" aria-label="App route" />
              <Mono>{banner.actionRoute}</Mono>
            </span>
          ) : banner.actionUrl ? (
            <a
              href={banner.actionUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex max-w-48 items-center gap-1.5 truncate text-primary hover:underline"
            >
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />{' '}
              <span className="truncate">{banner.actionUrl}</span>
            </a>
          ) : (
            <span className="text-muted-foreground">None</span>
          ),
      },
      { accessorKey: 'priority', header: 'Priority', meta: { cellClassName: 'tabular-nums' } },
      { id: 'schedule', header: 'Schedule', cell: ({ row: { original } }) => <Schedule banner={original} /> },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (banner) => bannerScheduleState(banner),
        cell: ({ getValue }) => {
          const state = getValue() as ScheduleState
          return <StatusBadge status={state} label={STATE_LABELS[state]} />
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original: banner } }) => (
          <RowActions
            label={`Actions for ${banner.title}`}
            actions={[
              { label: 'Edit', icon: Pencil, onSelect: () => navigate(`/admin/banners/${banner.id}/edit`) },
              {
                label: 'Delete',
                icon: Trash2,
                onSelect: () => setToDelete(banner),
                destructive: true,
                separated: true,
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  )

  const createButton = (
    <Button asChild>
      <Link to="/admin/banners/new">
        <Plus /> Add banner
      </Link>
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Promotional banners on the app home screen, highest priority first."
        actions={createButton}
      />

      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <SearchInput value={filters.q} onChange={(q) => update({ q })} placeholder="Search banners" />
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={filters.state}
          onChange={(state) => update({ state })}
          options={STATE_OPTIONS}
        />
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          getRowId={(banner) => banner.id}
          onRowClick={(banner) => navigate(`/admin/banners/${banner.id}/edit`)}
          enableSorting
          caption="Banners"
          emptyState={
            hasFilters ? (
              <NoResults what="banners" onClear={clear} />
            ) : (
              <EmptyState
                icon={Megaphone}
                title="No banners yet"
                description="Create a banner to promote rewards and offers on the home screen."
                action={createButton}
              />
            )
          }
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete banner?"
        description={
          <p>
            <span className="font-medium text-foreground">{toDelete?.title}</span> will be removed from the
            app home screen.
          </p>
        }
        confirmLabel="Delete banner"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
