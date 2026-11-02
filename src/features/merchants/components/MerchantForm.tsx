import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { EntitySelect } from '@/components/common/EntitySelect'
import { ColorField, NumberField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ImageField } from '@/features/media/components/ImageField'
import { useMerchantCategories } from '@/features/merchant-categories/api/hooks'
import { applyServerErrors } from '@/lib/forms'
import {
  MAX_TERMS,
  merchantSchema,
  merchantToForm,
  previewTrackingUrl,
  type MerchantFormValues,
} from '../schemas/merchant.schema'
import { SUB_ID_PLACEHOLDER, type Merchant } from '../types/merchant.types'

interface MerchantFormProps {
  merchant?: Merchant
  onSubmit: (values: MerchantFormValues) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}

export function MerchantForm({ merchant, onSubmit, onCancel, pending }: MerchantFormProps) {
  const isCreate = !merchant
  const categories = useMerchantCategories()
  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: merchantToForm(merchant),
  })
  const terms = useFieldArray({ control: form.control, name: 'terms' })
  const trackingUrl = useWatch({ control: form.control, name: 'trackingUrlTemplate' })

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="name"
                  label="Name"
                  required
                  maxLength={120}
                  placeholder="Nykaa"
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Category
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </FormLabel>
                      <FormControl>
                        <EntitySelect
                          items={categories.data}
                          isLoading={categories.isLoading}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? '')}
                          getValue={(category) => category.id}
                          getLabel={(category) => category.name}
                          placeholder="Choose a category"
                          aria-invalid={Boolean(fieldState.error)}
                        />
                      </FormControl>
                      {categories.data?.length === 0 && (
                        <FormDescription>
                          <Link to="/admin/merchant-categories" className="text-primary underline">
                            Create a category first.
                          </Link>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  required
                  rows={3}
                  maxLength={1000}
                  showCount
                  className="sm:col-span-2"
                />
                {isCreate && (
                  <TextField
                    control={form.control}
                    name="id"
                    label="ID"
                    placeholder="m_nykaa"
                    inputClassName="font-mono"
                    description="Optional. Used in /shop-and-earn/<id> links."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cashback & tracking</CardTitle>
                <CardDescription>
                  {SUB_ID_PLACEHOLDER} in the tracking link is replaced with each user's affiliate id, so
                  orders can be matched to them.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="rewardText"
                  label="Reward text"
                  required
                  maxLength={120}
                  placeholder="Up to 5% cashback"
                />
                <NumberField
                  control={form.control}
                  name="cashbackPercent"
                  label="Cashback"
                  required
                  min={0}
                  max={100}
                  step="any"
                  suffix="%"
                />
                <TextField
                  control={form.control}
                  name="trackingUrlTemplate"
                  label="Tracking URL template"
                  required
                  type="url"
                  className="sm:col-span-2"
                  inputClassName="font-mono text-xs"
                  placeholder="https://track.example/click?m=nykaa&sub={subId}"
                  description={
                    trackingUrl.includes(SUB_ID_PLACEHOLDER) ? (
                      <span className="break-all">Users open: {previewTrackingUrl(trackingUrl)}</span>
                    ) : (
                      `Must be https and contain ${SUB_ID_PLACEHOLDER}.`
                    )
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
                <CardDescription>
                  Cashback conditions shown on the store page (up to {MAX_TERMS}).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {terms.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <span className="mt-2 w-5 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                      {index + 1}.
                    </span>
                    <FormField
                      control={form.control}
                      name={`terms.${index}.value`}
                      render={({ field: input }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="sr-only">Term {index + 1}</FormLabel>
                          <FormControl>
                            <Input {...input} maxLength={300} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => terms.remove(index)}
                      aria-label={`Delete term ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => terms.append({ value: '' })}
                  disabled={terms.fields.length >= MAX_TERMS}
                >
                  <Plus /> Add term
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchField
                  control={form.control}
                  name="active"
                  label="Active"
                  description="Inactive stores are hidden in the app."
                />
                <SwitchField
                  control={form.control}
                  name="featured"
                  label="Featured"
                  description="Featured stores are listed first."
                />
                <NumberField
                  control={form.control}
                  name="sortOrder"
                  label="Sort order"
                  description="Lower numbers show first."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageField control={form.control} name="logoUrl" label="Logo" folder="merchants" />
                <ColorField control={form.control} name="brandColor" label="Brand colour" />
              </CardContent>
            </Card>
          </div>
        </div>
        <FormActions
          submitLabel={isCreate ? 'Create merchant' : 'Save changes'}
          pending={pending}
          onCancel={onCancel}
          sticky
        />
      </form>
    </Form>
  )
}
