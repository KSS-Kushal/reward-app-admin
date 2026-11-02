import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ClipboardPaste, Copy, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { EntityDialog } from '@/components/crud/EntityDialog'
import { NumberField, SwitchField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMerchant } from '@/features/merchants/api/queries'
import { ImageInput } from '@/features/media/components/ImageField'
import { applyServerErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useCreateProductsBulk } from '../api/mutations'
import { SubIdHint } from '../components/ProductForm'
import {
  bulkProductsSchema,
  emptyProduct,
  formToProductRequest,
  type BulkProductsFormValues,
} from '../schemas/product.schema'
import { MAX_BULK_PRODUCTS } from '../types/product.types'
import { PASTE_COLUMNS, parseSpreadsheet } from '../utils/parse-spreadsheet'

function ProductRow({
  control,
  index,
  hasErrors,
  canRemove,
  onRemove,
  onDuplicate,
}: {
  control: Control<BulkProductsFormValues>
  index: number
  hasErrors: boolean
  canRemove: boolean
  onRemove: () => void
  onDuplicate: () => void
}) {
  const affiliateUrl = useWatch({ control, name: `products.${index}.affiliateUrl` })
  return (
    <Card id={`product-row-${index}`} className={cn('gap-0 py-0', hasErrors && 'border-destructive/60')}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <span className="text-sm font-medium">
          Product {index + 1}
          {hasErrors && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-destructive">
              <AlertCircle className="size-3.5" /> Needs attention
            </span>
          )}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            aria-label={`Duplicate product ${index + 1}`}
          >
            <Copy /> Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Remove product ${index + 1}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 /> Remove
          </Button>
        </div>
      </div>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_minmax(0,1fr)]">
        <FormField
          control={control}
          name={`products.${index}.imageUrl`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Image</FormLabel>
              <FormControl>
                <div ref={field.ref} tabIndex={-1}>
                  <ImageInput value={field.value} onChange={field.onChange} folder="products" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <TextField
            control={control}
            name={`products.${index}.name`}
            label="Name"
            required
            maxLength={200}
            className="sm:col-span-2 lg:col-span-3"
          />
          <TextField
            control={control}
            name={`products.${index}.affiliateUrl`}
            label="Affiliate link"
            required
            type="url"
            inputClassName="font-mono text-xs"
            className="sm:col-span-2 lg:col-span-3"
            description={<SubIdHint url={affiliateUrl ?? ''} />}
          />
          <NumberField
            control={control}
            name={`products.${index}.price`}
            label="Price"
            required
            min={0}
            step="any"
          />
          <NumberField
            control={control}
            name={`products.${index}.originalPrice`}
            label="MRP"
            min={0}
            step="any"
          />
          <NumberField
            control={control}
            name={`products.${index}.rating`}
            label="Rating"
            min={0}
            max={5}
            step={0.1}
          />
          <TextField
            control={control}
            name={`products.${index}.rewardText`}
            label="Reward text"
            maxLength={120}
            className="lg:col-span-2"
          />
          <NumberField control={control} name={`products.${index}.sortOrder`} label="Sort" />
          <SwitchField
            control={control}
            name={`products.${index}.active`}
            label="Active"
            className="sm:col-span-2 lg:col-span-6"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function rowsWithErrors(errors: FieldErrors<BulkProductsFormValues>): number[] {
  const rows = errors.products
  if (!rows || !Array.isArray(rows)) return []
  return rows.map((row, index) => (row ? index : -1)).filter((index) => index >= 0)
}

export function BulkProductsPage() {
  const { id: merchantId } = useParams()
  const navigate = useNavigate()
  const merchant = useMerchant(merchantId)
  const bulk = useCreateProductsBulk()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  useBreadcrumbLabel(merchant.data?.name, `/admin/merchants/${merchantId}`)

  const form = useForm<BulkProductsFormValues>({
    resolver: zodResolver(bulkProductsSchema),
    defaultValues: { products: [emptyProduct(0)] },
  })
  const rows = useFieldArray({ control: form.control, name: 'products' })
  const errorRows = rowsWithErrors(form.formState.errors)
  const back = `/admin/merchants/${merchantId}/products`
  const full = rows.fields.length >= MAX_BULK_PRODUCTS

  const submit = form.handleSubmit(async (values) => {
    if (!merchantId) return
    try {
      await bulk.mutateAsync({
        merchantId,
        products: values.products.map((product) => formToProductRequest(product, true)),
      })
      form.reset(values)
      navigate(back)
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  const addPasted = () => {
    const isOnlyEmptyRow =
      rows.fields.length === 1 &&
      !form.getValues('products.0.name') &&
      !form.getValues('products.0.affiliateUrl')
    const start = isOnlyEmptyRow ? 0 : rows.fields.length
    const parsed = parseSpreadsheet(pasteText, start).slice(0, MAX_BULK_PRODUCTS - start)
    if (parsed.length === 0) return
    if (isOnlyEmptyRow) rows.replace(parsed)
    else rows.append(parsed)
    setPasteText('')
    setPasteOpen(false)
  }

  if (merchant.isLoading) return <PageSkeleton />
  if (merchant.isError || !merchant.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bulk import" backTo="/admin/merchants" />
        <ErrorState error={merchant.error} onRetry={() => void merchant.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk import products"
        description={`Add up to ${MAX_BULK_PRODUCTS} products to ${merchant.data.name} at once. Nothing is saved unless every product is valid.`}
        backTo={back}
        actions={
          <Button variant="outline" onClick={() => setPasteOpen(true)} disabled={full}>
            <ClipboardPaste /> Paste from spreadsheet
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />

          {errorRows.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>
                {errorRows.length} {errorRows.length === 1 ? 'product needs' : 'products need'} attention
              </AlertTitle>
              <AlertDescription>
                <p>
                  Fix the highlighted fields, then import again:{' '}
                  {errorRows.map((index, position) => (
                    <span key={index}>
                      {position > 0 && ', '}
                      <a href={`#product-row-${index}`} className="underline">
                        Product {index + 1}
                      </a>
                    </span>
                  ))}
                </p>
              </AlertDescription>
            </Alert>
          )}
          {form.formState.errors.products?.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.products.root.message}
            </p>
          )}

          <ol className="space-y-4">
            {rows.fields.map((field, index) => (
              <li key={field.id}>
                <ProductRow
                  control={form.control}
                  index={index}
                  hasErrors={errorRows.includes(index)}
                  canRemove={rows.fields.length > 1}
                  onRemove={() => rows.remove(index)}
                  onDuplicate={() =>
                    !full &&
                    rows.insert(index + 1, {
                      ...form.getValues(`products.${index}`),
                      id: '',
                      sortOrder: (form.getValues(`products.${index}.sortOrder`) ?? index) + 1,
                    })
                  }
                />
              </li>
            ))}
          </ol>

          <Button
            type="button"
            variant="outline"
            onClick={() => rows.append(emptyProduct(rows.fields.length))}
            disabled={full}
            className="w-full border-dashed"
          >
            <Plus /> Add product ({rows.fields.length}/{MAX_BULK_PRODUCTS})
          </Button>

          <FormActions
            submitLabel={`Import ${rows.fields.length} ${rows.fields.length === 1 ? 'product' : 'products'}`}
            pending={bulk.isPending}
            onCancel={() => navigate(back)}
            sticky
          />
        </form>
      </Form>

      <EntityDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        title="Paste from a spreadsheet"
        description="Copy rows from Excel or Google Sheets and paste them below. One product per row."
        className="sm:max-w-2xl"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Columns, in order:{' '}
            <span className="font-mono text-xs text-foreground">{PASTE_COLUMNS.join(' · ')}</span>. Only name,
            price and affiliateUrl are required; a header row is skipped automatically.
          </p>
          <Label htmlFor="paste-products" className="sr-only">
            Spreadsheet rows
          </Label>
          <Textarea
            id="paste-products"
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={
              'boAt Rockerz 450\t1299\t3990\thttps://www.amazon.in/dp/B07PR1CL3S?ascsubtag={subId}'
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addPasted} disabled={!pasteText.trim()}>
              Add rows
            </Button>
          </div>
        </div>
      </EntityDialog>
    </div>
  )
}
