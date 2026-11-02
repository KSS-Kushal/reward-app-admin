import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { Mono } from '@/components/common/display'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { EntityDialog } from '@/components/crud/EntityDialog'
import { NumberField, SelectField, SwitchField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ImageField } from '@/features/media/components/ImageField'
import { applyServerErrors, slugIdSchema } from '@/lib/forms'
import {
  useCreateEarnOption,
  useDeleteEarnOption,
  useEarnOptions,
  useSwapEarnOptions,
  useUpdateEarnOption,
} from '../api/hooks'
import {
  EARN_OPTION_TYPE_LABELS,
  EARN_OPTION_TYPES,
  type EarnOption,
  type EarnOptionRequest,
} from '../types/earn-option.types'

const schema = z.object({
  id: slugIdSchema(60),
  type: z.enum(EARN_OPTION_TYPES, { error: 'Type is required.' }),
  title: z.string().trim().min(1, 'Title is required.').max(120),
  subtitle: z.string().trim().min(1, 'Subtitle is required.').max(255),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int().nullable(),
  enabled: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const TYPE_OPTIONS = EARN_OPTION_TYPES.map((type) => ({ value: type, label: EARN_OPTION_TYPE_LABELS[type] }))

function EarnOptionForm({
  option,
  nextSortOrder,
  onSubmit,
  onCancel,
  pending,
}: {
  option?: EarnOption
  nextSortOrder: number
  onSubmit: (body: EarnOptionRequest) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: option?.id ?? '',
      type: option?.type ?? 'readAndEarn',
      title: option?.title ?? '',
      subtitle: option?.subtitle ?? '',
      imageUrl: option?.imageUrl ?? null,
      sortOrder: option?.sortOrder ?? nextSortOrder,
      enabled: option?.enabled ?? true,
    },
  })
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...(!option && values.id ? { id: values.id } : {}),
        type: values.type,
        title: values.title.trim(),
        subtitle: values.subtitle.trim(),
        imageUrl: values.imageUrl,
        sortOrder: values.sortOrder ?? 0,
        enabled: values.enabled,
      })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })
  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          options={TYPE_OPTIONS}
          required
          description="Which screen the card opens in the app."
        />
        <TextField control={form.control} name="title" label="Title" required maxLength={120} />
        <TextField control={form.control} name="subtitle" label="Subtitle" required maxLength={255} />
        {!option && (
          <TextField
            control={form.control}
            name="id"
            label="ID"
            placeholder="earn_games"
            inputClassName="font-mono"
            description="Optional. Generated when empty."
          />
        )}
        <ImageField control={form.control} name="imageUrl" label="Image" folder="earn-options" />
        <NumberField
          control={form.control}
          name="sortOrder"
          label="Sort order"
          description="Lower numbers show first."
        />
        <SwitchField
          control={form.control}
          name="enabled"
          label="Enabled"
          description="Disabled options are hidden in the app."
        />
        <FormActions
          submitLabel={option ? 'Save changes' : 'Create earn option'}
          pending={pending}
          onCancel={onCancel}
        />
      </form>
    </Form>
  )
}

export function EarnOptionsPage() {
  const query = useEarnOptions()
  const create = useCreateEarnOption()
  const update = useUpdateEarnOption()
  const remove = useDeleteEarnOption()
  const swap = useSwapEarnOptions()
  const [editing, setEditing] = useState<EarnOption | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<EarnOption | null>(null)

  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [query.data])
  const nextSortOrder = rows.length ? rows[rows.length - 1]!.sortOrder + 1 : 0

  const columns = useMemo<ColumnDef<EarnOption, unknown>[]>(
    () => [
      {
        id: 'order',
        header: 'Order',
        meta: { cellClassName: 'w-24' },
        cell: ({ row }) => {
          const index = row.index
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === 0 || swap.isPending}
                onClick={() =>
                  swap.mutate({ moving: rows[index]!, neighbour: rows[index - 1]!, direction: 'up' })
                }
                aria-label={`Move ${row.original.title} up`}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === rows.length - 1 || swap.isPending}
                onClick={() =>
                  swap.mutate({ moving: rows[index]!, neighbour: rows[index + 1]!, direction: 'down' })
                }
                aria-label={`Move ${row.original.title} down`}
              >
                <ArrowDown />
              </Button>
            </div>
          )
        },
      },
      {
        id: 'option',
        header: 'Earn option',
        cell: ({ row: { original } }) => (
          <div className="flex min-w-56 items-center gap-3">
            <ImagePreview src={original.imageUrl} alt="" className="size-10" />
            <div className="min-w-0">
              <p className="truncate font-medium">{original.title}</p>
              <p className="truncate text-xs text-muted-foreground">{original.subtitle}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row: { original } }) => (
          <Badge variant="secondary">{EARN_OPTION_TYPE_LABELS[original.type] ?? original.type}</Badge>
        ),
      },
      { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <Mono>{getValue() as string}</Mono> },
      { accessorKey: 'sortOrder', header: 'Sort', meta: { cellClassName: 'tabular-nums' } },
      {
        accessorKey: 'enabled',
        header: 'Status',
        cell: ({ getValue }) => (
          <BooleanBadge value={getValue() as boolean} trueLabel="Enabled" falseLabel="Disabled" />
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label={`Actions for ${original.title}`}
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
    [rows, swap],
  )

  const addButton = (
    <Button onClick={() => setEditing('new')}>
      <Plus /> Add earn option
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earn Options"
        description="The ways to earn shown on the app home screen, in display order."
        actions={addButton}
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          isFetching={swap.isPending}
          getRowId={(option) => option.id}
          caption="Earn options"
          emptyState={
            <EmptyState
              icon={Sparkles}
              title="No earn options yet"
              description="Add the first way for users to earn coins."
              action={addButton}
            />
          }
        />
      )}

      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'New earn option' : 'Edit earn option'}
      >
        <EarnOptionForm
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
        title="Delete earn option?"
        description={
          <p>
            <span className="font-medium text-foreground">{toDelete?.title}</span> will be removed from the
            app home screen.
          </p>
        }
        confirmLabel="Delete earn option"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
