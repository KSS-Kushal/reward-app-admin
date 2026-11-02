import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { ColorField, DateTimeField, NumberField, SwitchField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
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
import { APP_ROUTES } from '@/lib/app-routes'
import { applyServerErrors } from '@/lib/forms'
import { bannerSchema, bannerToForm, type BannerFormValues } from '../schemas/banner.schema'
import type { Banner } from '../types/banner.types'
import { BannerPreview } from './BannerPreview'

interface BannerFormProps {
  banner?: Banner
  onSubmit: (values: BannerFormValues) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}

export function BannerForm({ banner, onSubmit, onCancel, pending }: BannerFormProps) {
  const isCreate = !banner
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: bannerToForm(banner),
  })
  const values = useWatch({ control: form.control }) as BannerFormValues

  const submit = form.handleSubmit(async (formValues) => {
    try {
      await onSubmit(formValues)
      form.reset(formValues)
    } catch (error) {
      applyServerErrors(form, error, {
        gradient: 'gradientStart',
        'gradient[0]': 'gradientStart',
        'gradient[1]': 'gradientEnd',
      })
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>What the banner says.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="title"
                  label="Title"
                  required
                  maxLength={160}
                  className="sm:col-span-2"
                  placeholder="Spin & win up to 100 coins"
                />
                <TextField
                  control={form.control}
                  name="subtitle"
                  label="Subtitle"
                  maxLength={255}
                  className="sm:col-span-2"
                  placeholder="3 free spins every day"
                />
                <TextField
                  control={form.control}
                  name="tag"
                  label="Tag"
                  maxLength={20}
                  placeholder="e.g. Ad, New"
                  description="Small label shown above the title."
                />
                {isCreate && (
                  <TextField
                    control={form.control}
                    name="id"
                    label="ID"
                    placeholder="banner_diwali"
                    inputClassName="font-mono"
                    description="Optional. Generated when empty; can't be changed later."
                  />
                )}
                <ImageField
                  control={form.control}
                  name="imageUrl"
                  label="Image"
                  folder="banners"
                  aspect="wide"
                  className="sm:col-span-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action</CardTitle>
                <CardDescription>
                  Where a tap on the banner goes. Use an app route, a web link, or neither.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="actionRoute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App route</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          list="banner-app-routes"
                          placeholder="/spin-wheel"
                          className="font-mono"
                          autoComplete="off"
                        />
                      </FormControl>
                      <datalist id="banner-app-routes">
                        {APP_ROUTES.map((route) => (
                          <option key={route.value} value={route.value}>
                            {route.label}
                          </option>
                        ))}
                      </datalist>
                      <FormDescription>
                        Also /articles/&lt;id&gt; and /shop-and-earn/&lt;id&gt;.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextField
                  control={form.control}
                  name="actionUrl"
                  label="Web link"
                  type="url"
                  placeholder="https://…"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchField
                  control={form.control}
                  name="useGradient"
                  label="Gradient background"
                  description="Two colours blended behind the text."
                />
                {values.useGradient && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField control={form.control} name="gradientStart" label="Gradient start" required />
                    <ColorField control={form.control} name="gradientEnd" label="Gradient end" required />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Approximate look in the app.</CardDescription>
              </CardHeader>
              <CardContent>
                <BannerPreview
                  title={values.title}
                  subtitle={values.subtitle}
                  imageUrl={values.imageUrl}
                  tag={values.tag}
                  gradient={values.useGradient ? [values.gradientStart, values.gradientEnd] : null}
                  hasAction={Boolean(values.actionRoute || values.actionUrl)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchField
                  control={form.control}
                  name="active"
                  label="Active"
                  description="Inactive banners are never shown."
                />
                <NumberField
                  control={form.control}
                  name="priority"
                  label="Priority"
                  description="Higher numbers show first."
                  step={1}
                />
                <DateTimeField
                  control={form.control}
                  name="startsAt"
                  label="Starts at"
                  placeholder="Immediately"
                />
                <DateTimeField
                  control={form.control}
                  name="endsAt"
                  label="Ends at"
                  placeholder="No end date"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <FormActions
          submitLabel={isCreate ? 'Create banner' : 'Save changes'}
          pending={pending}
          onCancel={onCancel}
          sticky
        />
      </form>
    </Form>
  )
}
