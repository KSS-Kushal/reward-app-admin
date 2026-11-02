import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgePercent, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { DataTable } from '@/components/common/DataTable'
import { DateDisplay, Mono } from '@/components/common/display'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EntityDialog } from '@/components/crud/EntityDialog'
import { DateTimeField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { isPast } from '@/lib/format'
import { applyServerErrors, emptyToNull, slugIdSchema } from '@/lib/forms'
import { useCreateOffer, useDeleteOffer, useMerchantOffers, useUpdateOffer } from '../api/hooks'
import type { Offer, OfferRequest } from '../types/offer.types'

const schema = z.object({
  id: slugIdSchema(60),
  title: z.string().trim().min(1, 'Title is required.').max(160),
  description: z.string().trim().min(1, 'Description is required.').max(500),
  couponCode: z.string().trim().max(40, 'Coupon code must be at most 40 characters.'),
  expiresAt: z.string().nullable(),
  active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function offerState(offer: Offer): 'ACTIVE' | 'INACTIVE' | 'EXPIRED' {
  if (!offer.active) return 'INACTIVE'
  if (isPast(offer.expiresAt)) return 'EXPIRED'
  return 'ACTIVE'
}

function OfferForm({
  offer,
  onSubmit,
  onCancel,
  pending,
}: {
  offer?: Offer
  onSubmit: (body: OfferRequest) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: offer?.id ?? '',
      title: offer?.title ?? '',
      description: offer?.description ?? '',
      couponCode: offer?.couponCode ?? '',
      expiresAt: offer?.expiresAt ?? null,
      active: offer?.active ?? true,
    },
  })
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...(!offer && values.id ? { id: values.id } : {}),
        title: values.title.trim(),
        description: values.description.trim(),
        couponCode: emptyToNull(values.couponCode),
        expiresAt: values.expiresAt,
        active: values.active,
      })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })
  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField
          control={form.control}
          name="title"
          label="Title"
          required
          maxLength={160}
          placeholder="Flat 20% off"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          required
          rows={3}
          maxLength={500}
          placeholder="On your first order."
        />
        <TextField
          control={form.control}
          name="couponCode"
          label="Coupon code"
          maxLength={40}
          inputClassName="font-mono uppercase"
          placeholder="NYKAA20"
          description="Optional. Users can copy it in the app."
        />
        <DateTimeField control={form.control} name="expiresAt" label="Expires at" placeholder="No expiry" />
        {!offer && (
          <TextField
            control={form.control}
            name="id"
            label="ID"
            placeholder="offer_nykaa20"
            inputClassName="font-mono"
            description="Optional. Generated when empty."
          />
        )}
        <SwitchField control={form.control} name="active" label="Active" />
        <FormActions
          submitLabel={offer ? 'Save changes' : 'Create offer'}
          pending={pending}
          onCancel={onCancel}
        />
      </form>
    </Form>
  )
}

/** Offers of one store: list, create, edit, delete. */
export function OffersPanel({ merchantId, merchantName }: { merchantId: string; merchantName?: string }) {
  const query = useMerchantOffers(merchantId)
  const create = useCreateOffer()
  const update = useUpdateOffer()
  const remove = useDeleteOffer()
  const [editing, setEditing] = useState<Offer | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Offer | null>(null)

  const columns = useMemo<ColumnDef<Offer, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Offer',
        cell: ({ row: { original } }) => (
          <div className="max-w-md min-w-56">
            <p className="font-medium">{original.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: 'couponCode',
        header: 'Coupon',
        cell: ({ getValue }) => {
          const code = getValue() as string | null
          return code ? (
            <span className="inline-flex items-center gap-1">
              <Mono>{code}</Mono>
              <CopyButton value={code} label="Copy coupon code" />
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ getValue }) =>
          getValue() ? (
            <DateDisplay value={getValue() as string} />
          ) : (
            <span className="text-muted-foreground">Never</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row: { original } }) => <StatusBadge status={offerState(original)} />,
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
    [],
  )

  const addButton = (
    <Button onClick={() => setEditing('new')}>
      <Plus /> Add offer
    </Button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Coupons and deals shown on{' '}
          {merchantName ? <span className="font-medium text-foreground">{merchantName}</span> : 'the store'}'s
          page.
        </p>
        {addButton}
      </div>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={query.data}
          isLoading={query.isLoading}
          getRowId={(offer) => offer.id}
          onRowClick={setEditing}
          caption="Offers"
          emptyState={
            <EmptyState
              icon={BadgePercent}
              title="No offers yet"
              description="Add a coupon or deal for this store."
              action={addButton}
            />
          }
        />
      )}

      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'New offer' : 'Edit offer'}
      >
        <OfferForm
          offer={editing === 'new' || editing === null ? undefined : editing}
          pending={create.isPending || update.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={async (body) => {
            if (editing && editing !== 'new') await update.mutateAsync({ id: editing.id, body })
            else await create.mutateAsync({ merchantId, body })
            setEditing(null)
          }}
        />
      </EntityDialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete offer?"
        description={
          <p>
            <span className="font-medium text-foreground">{toDelete?.title}</span> will be removed from the
            store page.
          </p>
        }
        confirmLabel="Delete offer"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
