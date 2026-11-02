import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { NumberField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { ImageField } from '@/features/media/components/ImageField'
import { applyServerErrors } from '@/lib/forms'
import { productSchema, productToForm, tracksUser, type ProductFormValues } from '../schemas/product.schema'
import type { Product } from '../types/product.types'
import { ProductCard } from './ProductCard'

export function SubIdHint({ url }: { url: string }) {
  if (!url)
    return (
      <>
        Put {'{subId}'} where the network takes a sub-id (Amazon ascsubtag, Flipkart affExtParam1,
        Cuelinks/EarnKaro subid).
      </>
    )
  return tracksUser(url) ? (
    <span className="inline-flex items-center gap-1 text-success">
      <CheckCircle2 className="size-3.5" aria-hidden /> Orders can be matched to users ({'{subId}'} found).
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-warning-foreground dark:text-warning">
      <AlertTriangle className="size-3.5" aria-hidden /> No {'{subId}'}: the link is shared as-is and orders
      can't be matched to users.
    </span>
  )
}

interface ProductFormProps {
  product?: Product
  onSubmit: (values: ProductFormValues) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}

export function ProductForm({ product, onSubmit, onCancel, pending }: ProductFormProps) {
  const isCreate = !product
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productToForm(product),
  })
  const values = useWatch({ control: form.control }) as ProductFormValues

  const submit = form.handleSubmit(async (formValues) => {
    try {
      await onSubmit(formValues)
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <TextareaField
                  control={form.control}
                  name="name"
                  label="Name"
                  required
                  rows={2}
                  maxLength={200}
                  className="sm:col-span-2"
                  placeholder="boAt Rockerz 450 Bluetooth Headphones"
                />
                <TextareaField
                  control={form.control}
                  name="affiliateUrl"
                  label="Affiliate link"
                  required
                  rows={2}
                  className="sm:col-span-2"
                  textareaClassName="font-mono text-xs break-all"
                  placeholder="https://www.amazon.in/dp/B07PR1CL3S?tag=yourtag-21&ascsubtag={subId}"
                  description={<SubIdHint url={values.affiliateUrl ?? ''} />}
                />
                <TextField
                  control={form.control}
                  name="rewardText"
                  label="Reward text"
                  maxLength={120}
                  placeholder="Up to ₹65 back"
                />
                {isCreate && (
                  <TextField
                    control={form.control}
                    name="id"
                    label="ID"
                    placeholder="prod_boat_450"
                    inputClassName="font-mono"
                    description="Optional. Generated when empty."
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Shown on the product tile; the store's checkout price is what counts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <NumberField control={form.control} name="price" label="Price" required min={0} step="any" />
                <NumberField
                  control={form.control}
                  name="originalPrice"
                  label="Original price (MRP)"
                  min={0}
                  step="any"
                  description="Optional. Shown struck through."
                />
                <TextField
                  control={form.control}
                  name="currencySymbol"
                  label="Currency symbol"
                  maxLength={8}
                  description="Defaults to ₹."
                />
                <NumberField
                  control={form.control}
                  name="rating"
                  label="Rating"
                  min={0}
                  max={5}
                  step={0.1}
                  description="0–5, one decimal."
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ProductCard
                  name={values.name}
                  imageUrl={values.imageUrl}
                  price={values.price}
                  originalPrice={values.originalPrice}
                  currencySymbol={values.currencySymbol}
                  rating={values.rating}
                  rewardText={values.rewardText || null}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Image & visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageField control={form.control} name="imageUrl" label="Image" folder="products" />
                <SwitchField
                  control={form.control}
                  name="active"
                  label="Active"
                  description="Inactive products are hidden."
                />
                <NumberField
                  control={form.control}
                  name="sortOrder"
                  label="Sort order"
                  description="Lower numbers show first."
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <FormActions
          submitLabel={isCreate ? 'Create product' : 'Save changes'}
          pending={pending}
          onCancel={onCancel}
          sticky
        />
      </form>
    </Form>
  )
}
