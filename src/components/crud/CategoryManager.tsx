import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { DateDisplay, Mono } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { NumberField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { applyServerErrors } from '@/lib/forms'
import { categorySchema, type Category, type CategoryFormValues, type CategoryRequest } from './category'
import { EntityDialog } from './EntityDialog'

interface CategoryManagerProps {
  title: string
  description: string
  /** Singular noun, e.g. "article category". */
  noun: string
  /** What blocks deletion, e.g. "articles". */
  children: string
  query: UseQueryResult<Category[]>
  create: UseMutationResult<Category, unknown, CategoryRequest>
  update: UseMutationResult<Category, unknown, { id: string; body: CategoryRequest }>
  remove: UseMutationResult<null, unknown, string>
}

function CategoryForm({
  category,
  onSubmit,
  onCancel,
  pending,
}: {
  category?: Category
  onSubmit: (body: CategoryRequest) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: category?.id ?? '',
      name: category?.name ?? '',
      sortOrder: category?.sortOrder ?? 0,
    },
  })
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...(!category && values.id ? { id: values.id } : {}),
        name: values.name.trim(),
        sortOrder: values.sortOrder ?? 0,
      })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })
  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField control={form.control} name="name" label="Name" required maxLength={80} />
        {!category && (
          <TextField
            control={form.control}
            name="id"
            label="ID"
            placeholder="e.g. finance"
            inputClassName="font-mono"
            description="Optional. Used by the app to filter; can't be changed later."
          />
        )}
        <NumberField
          control={form.control}
          name="sortOrder"
          label="Sort order"
          description="Lower numbers show first."
        />
        <FormActions
          submitLabel={category ? 'Save changes' : 'Create category'}
          pending={pending}
          onCancel={onCancel}
        />
      </form>
    </Form>
  )
}

export function CategoryManager({
  title,
  description,
  noun,
  children,
  query,
  create,
  update,
  remove,
}: CategoryManagerProps) {
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)
  const sorted = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [query.data],
  )

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
      },
      { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <Mono>{getValue() as string}</Mono> },
      { accessorKey: 'sortOrder', header: 'Sort order', meta: { cellClassName: 'tabular-nums' } },
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
      <Plus /> Add category
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={addButton} />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={sorted}
          isLoading={query.isLoading}
          getRowId={(category) => category.id}
          onRowClick={setEditing}
          enableSorting
          caption={title}
          emptyState={
            <EmptyState
              icon={FolderTree}
              title="No categories yet"
              description={`Create the first ${noun}.`}
              action={addButton}
            />
          }
        />
      )}

      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? `New ${noun}` : `Edit ${noun}`}
      >
        <CategoryForm
          category={editing === 'new' || editing === null ? undefined : editing}
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
        title={`Delete ${noun}?`}
        description={
          <>
            <p>
              <span className="font-medium text-foreground">{toDelete?.name}</span> will be deleted.
            </p>
            <p>A category that still has {children} can't be deleted. Move or delete them first.</p>
          </>
        }
        confirmLabel="Delete category"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
