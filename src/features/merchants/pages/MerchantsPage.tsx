import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Package, Pencil, Plus, Star, Store, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { FilterSelect } from '@/components/common/FilterSelect'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useMerchantCategories } from '@/features/merchant-categories/api/hooks'
import { useListParams } from '@/hooks/use-list-params'
import { useMerchants } from '../api/queries'
import { DeleteMerchantDialog } from '../components/DeleteMerchantDialog'
import type { Merchant } from '../types/merchant.types'

const FILTER_KEYS = ['q', 'categoryId'] as const

export function MerchantsPage() {
  const navigate = useNavigate()
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const query = useMerchants({ q: filters.q, categoryId: filters.categoryId, page, limit })
  const categories = useMerchantCategories()
  const [toDelete, setToDelete] = useState<Merchant | null>(null)

  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    [categories.data],
  )
  const categoryOptions = useMemo(
    () => (categories.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [categories.data],
  )

  const columns = useMemo<ColumnDef<Merchant, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Merchant',
        cell: ({ row: { original } }) => (
          <div className="flex min-w-52 items-center gap-3">
            <ImagePreview src={original.logoUrl} alt="" className="size-10" fit="contain" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {original.name}
                {original.featured && (
                  <Star className="size-3.5 fill-warning text-warning" aria-label="Featured" />
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{original.rewardText}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ getValue }) => categoryNames.get(getValue() as string) ?? (getValue() as string),
      },
      {
        accessorKey: 'cashbackPercent',
        header: 'Cashback',
        cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}%</span>,
      },
      {
        accessorKey: 'featured',
        header: 'Featured',
        cell: ({ getValue }) => (getValue() ? 'Yes' : <span className="text-muted-foreground">No</span>),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => <BooleanBadge value={getValue() as boolean} />,
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
              { label: 'View', icon: Eye, onSelect: () => navigate(`/admin/merchants/${original.id}`) },
              {
                label: 'Edit',
                icon: Pencil,
                onSelect: () => navigate(`/admin/merchants/${original.id}/edit`),
              },
              {
                label: 'Products',
                icon: Package,
                onSelect: () => navigate(`/admin/merchants/${original.id}/products`),
              },
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
    [categoryNames, navigate],
  )

  const createButton = (
    <Button asChild>
      <Link to="/admin/merchants/new">
        <Plus /> Add merchant
      </Link>
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchants"
        description="Stores in Shop & Earn: featured first, then by sort order."
        actions={createButton}
      />
      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <SearchInput value={filters.q} onChange={(q) => update({ q })} placeholder="Search by name" />
        <FilterSelect
          label="Category"
          allLabel="All categories"
          value={filters.categoryId}
          onChange={(categoryId) => update({ categoryId })}
          options={categoryOptions}
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
            getRowId={(merchant) => merchant.id}
            onRowClick={(merchant) => navigate(`/admin/merchants/${merchant.id}`)}
            caption="Merchants"
            emptyState={
              hasFilters ? (
                <NoResults what="merchants" onClear={clear} />
              ) : (
                <EmptyState
                  icon={Store}
                  title="No merchants yet"
                  description="Add stores so users can shop and earn cashback."
                  action={createButton}
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
      <DeleteMerchantDialog merchant={toDelete} onClose={() => setToDelete(null)} />
    </div>
  )
}
