import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, ExternalLink, Package, Pencil, Plus, Star, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { CurrencyDisplay } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { ImagePreview } from '@/components/common/ImagePreview'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useListParams } from '@/hooks/use-list-params'
import { useDeleteProduct } from '../api/mutations'
import { useMerchantProducts } from '../api/queries'
import type { Product } from '../types/product.types'

const FILTER_KEYS = ['q', 'active'] as const
const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

/** Product grid of one store, with URL-synced search, status filter and pagination. */
export function ProductsPanel({ merchantId }: { merchantId: string }) {
  const navigate = useNavigate()
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const active = filters.active === 'true' || filters.active === 'false' ? filters.active : ''
  const query = useMerchantProducts(merchantId, { q: filters.q, active, page, limit })
  const remove = useDeleteProduct()
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row: { original } }) => (
          <div className="flex max-w-md min-w-60 items-center gap-3">
            <ImagePreview src={original.imageUrl} alt="" className="size-11 bg-white" fit="contain" />
            <div className="min-w-0">
              <p className="line-clamp-2 font-medium">{original.name}</p>
              {original.rewardText && <p className="truncate text-xs text-primary">{original.rewardText}</p>}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row: { original } }) => (
          <div className="whitespace-nowrap">
            <CurrencyDisplay
              value={original.price}
              symbol={original.currencySymbol}
              className="font-medium"
            />
            {original.originalPrice !== null && original.originalPrice > original.price && (
              <CurrencyDisplay
                value={original.originalPrice}
                symbol={original.currencySymbol}
                className="ml-1.5 text-xs text-muted-foreground line-through"
              />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ getValue }) => {
          const rating = getValue() as number | null
          return rating === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="size-3.5 fill-warning text-warning" aria-hidden /> {rating.toFixed(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'tracksUser',
        header: 'Link',
        cell: ({ row: { original } }) => (
          <span className="inline-flex items-center gap-1.5">
            <a
              href={original.affiliateUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
              aria-label="Open affiliate link"
            >
              <ExternalLink className="size-4" />
            </a>
            {!original.tracksUser && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle
                    className="size-4 text-warning"
                    aria-label="Not tracking users"
                    tabIndex={0}
                  />
                </TooltipTrigger>
                <TooltipContent>No {'{subId}'} in the link: orders can't be matched to users.</TooltipContent>
              </Tooltip>
            )}
          </span>
        ),
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
            label="Product actions"
            actions={[
              {
                label: 'Edit',
                icon: Pencil,
                onSelect: () => navigate(`/admin/products/${original.id}/edit`),
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
    [navigate],
  )

  const addButtons = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild>
        <Link to={`/admin/merchants/${merchantId}/products/bulk`}>
          <Upload /> Bulk import
        </Link>
      </Button>
      <Button asChild>
        <Link to={`/admin/merchants/${merchantId}/products/new`}>
          <Plus /> Add product
        </Link>
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <DataTableToolbar hasFilters={hasFilters} onClear={clear} end={addButtons}>
        <SearchInput value={filters.q} onChange={(q) => update({ q })} placeholder="Search products" />
        <FilterSelect
          label="Status"
          allLabel="All products"
          value={active}
          onChange={(value) => update({ active: value })}
          options={ACTIVE_OPTIONS}
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
            getRowId={(product) => product.id}
            onRowClick={(product) => navigate(`/admin/products/${product.id}/edit`)}
            caption="Products"
            emptyState={
              hasFilters ? (
                <NoResults what="products" onClear={clear} />
              ) : (
                <EmptyState
                  icon={Package}
                  title="No products yet"
                  description="Add products one by one, or import up to 100 at once."
                  action={addButtons}
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
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete product?"
        description={
          <p>
            <span className="font-medium text-foreground">{toDelete?.name}</span> will be removed from the
            store's product grid.
          </p>
        }
        confirmLabel="Delete product"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
