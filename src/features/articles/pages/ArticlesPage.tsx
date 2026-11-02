import type { ColumnDef } from '@tanstack/react-table'
import { Archive, FileText, Pencil, Plus, Send, Trash2, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { CoinsDisplay, DateDisplay } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RowActions } from '@/components/common/RowActions'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useArticleCategories } from '@/features/article-categories/api/hooks'
import { useListParams } from '@/hooks/use-list-params'
import { useChangeArticleStatus, useDeleteArticle } from '../api/mutations'
import { useArticles } from '../api/queries'
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUSES,
  type Article,
  type ArticleStatus,
} from '../types/article.types'

const FILTER_KEYS = ['q', 'status', 'categoryId'] as const
const STATUS_OPTIONS = ARTICLE_STATUSES.map((status) => ({
  value: status,
  label: ARTICLE_STATUS_LABELS[status],
}))

export function ArticlesPage() {
  const navigate = useNavigate()
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS)
  const status = (ARTICLE_STATUSES as readonly string[]).includes(filters.status)
    ? (filters.status as ArticleStatus)
    : ''
  const query = useArticles({ q: filters.q, status, categoryId: filters.categoryId, page, limit })
  const categories = useArticleCategories()
  const changeStatus = useChangeArticleStatus()
  const remove = useDeleteArticle()
  const [toDelete, setToDelete] = useState<Article | null>(null)

  const categoryOptions = useMemo(
    () => (categories.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [categories.data],
  )

  const columns = useMemo<ColumnDef<Article, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row: { original } }) => (
          <div className="flex max-w-md min-w-64 items-center gap-3">
            <ImagePreview src={original.imageUrl} alt="" className="h-10 w-14" />
            <div className="min-w-0">
              <p className="truncate font-medium">{original.title}</p>
              <p className="truncate text-xs text-muted-foreground">{original.summary}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'categoryName', header: 'Category' },
      { accessorKey: 'author', header: 'Author', meta: { cellClassName: 'whitespace-nowrap' } },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: 'rewardCoins',
        header: 'Reward',
        cell: ({ getValue }) => {
          const coins = getValue() as number
          return coins > 0 ? (
            <CoinsDisplay value={coins} icon />
          ) : (
            <span className="text-muted-foreground">None</span>
          )
        },
      },
      {
        accessorKey: 'readTimeMinutes',
        header: 'Read time',
        cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as number} min</span>,
      },
      {
        accessorKey: 'publishedAt',
        header: 'Published',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => <DateDisplay value={getValue() as string} mode="relative" />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label={`Actions for ${original.title}`}
            actions={[
              {
                label: 'Edit',
                icon: Pencil,
                onSelect: () => navigate(`/admin/articles/${original.id}/edit`),
              },
              {
                label: 'Publish',
                icon: Send,
                hidden: original.status === 'PUBLISHED',
                disabled: changeStatus.isPending,
                onSelect: () => changeStatus.mutate({ id: original.id, status: 'PUBLISHED' }),
                separated: true,
              },
              {
                label: 'Move to draft',
                icon: Undo2,
                hidden: original.status === 'DRAFT',
                disabled: changeStatus.isPending,
                onSelect: () => changeStatus.mutate({ id: original.id, status: 'DRAFT' }),
              },
              {
                label: 'Archive',
                icon: Archive,
                hidden: original.status === 'ARCHIVED',
                disabled: changeStatus.isPending,
                onSelect: () => changeStatus.mutate({ id: original.id, status: 'ARCHIVED' }),
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
    [navigate, changeStatus],
  )

  const createButton = (
    <Button asChild>
      <Link to="/admin/articles/new">
        <Plus /> Create article
      </Link>
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        description="Manage articles shown in the Kavodnik application."
        actions={createButton}
      />

      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <SearchInput value={filters.q} onChange={(q) => update({ q })} placeholder="Search by title" />
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={status}
          onChange={(value) => update({ status: value })}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Category"
          allLabel="All categories"
          value={filters.categoryId}
          onChange={(categoryId) => update({ categoryId })}
          options={categoryOptions}
          disabled={categories.isLoading}
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
            getRowId={(article) => article.id}
            onRowClick={(article) => navigate(`/admin/articles/${article.id}/edit`)}
            caption="Articles"
            emptyState={
              hasFilters ? (
                <NoResults what="articles" onClear={clear} />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No articles found"
                  description="Create your first article so users can read and earn."
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

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete article?"
        description={
          <p>
            <span className="font-medium text-foreground">{toDelete?.title}</span> will be removed from the
            app. This action cannot be undone.
          </p>
        }
        confirmLabel="Delete article"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
