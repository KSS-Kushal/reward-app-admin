import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { RowActions } from '@/components/common/RowActions'
import { EmptyState, ErrorState } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { EntityDialog } from '@/components/crud/EntityDialog'
import { NumberField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { applyServerErrors, slugIdSchema } from '@/lib/forms'
import { useCreateFaq, useDeleteFaq, useFaqs, useUpdateFaq } from '../api/hooks'
import type { Faq, FaqRequest } from '../types/faq.types'

const schema = z.object({
  id: slugIdSchema(60),
  question: z.string().trim().min(1, 'Question is required.').max(255),
  answer: z.string().trim().min(1, 'Answer is required.').max(2000),
  sortOrder: z.number().int().nullable(),
  active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function FaqForm({
  faq,
  nextSortOrder,
  onSubmit,
  onCancel,
  pending,
}: {
  faq?: Faq
  nextSortOrder: number
  onSubmit: (body: FaqRequest) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: faq?.id ?? '',
      question: faq?.question ?? '',
      answer: faq?.answer ?? '',
      sortOrder: faq?.sortOrder ?? nextSortOrder,
      active: faq?.active ?? true,
    },
  })
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...(!faq && values.id ? { id: values.id } : {}),
        question: values.question.trim(),
        answer: values.answer.trim(),
        sortOrder: values.sortOrder ?? 0,
        active: values.active,
      })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })
  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField control={form.control} name="question" label="Question" required maxLength={255} />
        <TextareaField
          control={form.control}
          name="answer"
          label="Answer"
          required
          rows={6}
          maxLength={2000}
          showCount
        />
        {!faq && (
          <TextField
            control={form.control}
            name="id"
            label="ID"
            placeholder="faq_free"
            inputClassName="font-mono"
            description="Optional. Generated when empty."
          />
        )}
        <NumberField
          control={form.control}
          name="sortOrder"
          label="Sort order"
          description="Lower numbers show first."
        />
        <SwitchField
          control={form.control}
          name="active"
          label="Active"
          description="Inactive FAQs are hidden from Contact Us."
        />
        <FormActions
          submitLabel={faq ? 'Save changes' : 'Create FAQ'}
          pending={pending}
          onCancel={onCancel}
        />
      </form>
    </Form>
  )
}

export function FaqsPage() {
  const query = useFaqs()
  const create = useCreateFaq()
  const update = useUpdateFaq()
  const remove = useDeleteFaq()
  const [editing, setEditing] = useState<Faq | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Faq | null>(null)

  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [query.data])
  const nextSortOrder = rows.length ? rows[rows.length - 1]!.sortOrder + 1 : 0
  const live = rows.filter((faq) => faq.active)

  const columns = useMemo<ColumnDef<Faq, unknown>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Question',
        cell: ({ row: { original } }) => (
          <div className="max-w-xl min-w-64">
            <p className="font-medium">{original.question}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{original.answer}</p>
          </div>
        ),
      },
      { accessorKey: 'sortOrder', header: 'Sort', meta: { cellClassName: 'tabular-nums' } },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => <BooleanBadge value={getValue() as boolean} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: { cellClassName: 'w-12 text-right' },
        cell: ({ row: { original } }) => (
          <RowActions
            label="FAQ actions"
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
      <Plus /> Add FAQ
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQs"
        description="Questions and answers shown on the app's Contact Us screen."
        actions={addButton}
      />

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Tabs defaultValue="manage">
          <TabsList>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="manage" className="pt-2">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={query.isLoading}
              getRowId={(faq) => faq.id}
              onRowClick={setEditing}
              caption="FAQs"
              emptyState={
                <EmptyState
                  icon={HelpCircle}
                  title="No FAQs yet"
                  description="Answer common questions so users don't have to contact support."
                  action={addButton}
                />
              }
            />
          </TabsContent>
          <TabsContent value="preview" className="pt-2">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Frequently asked questions</CardTitle>
                <CardDescription>Active FAQs in display order, as users see them.</CardDescription>
              </CardHeader>
              <CardContent>
                {live.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active FAQs.</p>
                ) : (
                  <Accordion type="single" collapsible>
                    {live.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent className="whitespace-pre-line text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <EntityDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'New FAQ' : 'Edit FAQ'}
      >
        <FaqForm
          faq={editing === 'new' || editing === null ? undefined : editing}
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
        title="Delete FAQ?"
        description={<p>“{toDelete?.question}” will be removed from Contact Us.</p>}
        confirmLabel="Delete FAQ"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
