import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { DateDisplay } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { applyServerErrors } from '@/lib/forms'
import { useUpdateConfig } from '../api/hooks'
import type { ConfigEntry } from '../types/config.types'

interface ConfigCardProps<T extends FieldValues> {
  entry: ConfigEntry
  title: string
  description?: ReactNode
  schema: z.ZodType<T, T>
  defaultValues: T
  /** Form values → the JSON value sent to `PUT /admin/config/{key}`. */
  toValue: (values: T) => object
  children: (form: UseFormReturn<T>) => ReactNode
}

/**
 * One configuration key as a self-contained form with its own save button.
 * Fields the form doesn't know about are kept (merged over the stored value), so nothing is lost on save.
 */
export function ConfigCard<T extends FieldValues>({
  entry,
  title,
  description,
  schema,
  defaultValues,
  toValue,
  children,
}: ConfigCardProps<T>) {
  const update = useUpdateConfig(title)
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues: defaultValues as DefaultValues<T> })
  const dirty = form.formState.isDirty

  const submit = form.handleSubmit(async (values) => {
    const stored =
      typeof entry.value === 'object' && entry.value !== null && !Array.isArray(entry.value)
        ? entry.value
        : {}
    try {
      await update.mutateAsync({ key: entry.key, value: { ...stored, ...toValue(values) } })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <Card id={`config-${entry.key}`} className="scroll-mt-20">
      <Form {...form}>
        <form onSubmit={submit} noValidate>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{title}</CardTitle>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {entry.key}
              </code>
              {dirty && (
                <Badge
                  variant="outline"
                  className="border-warning/50 text-warning-foreground dark:text-warning"
                >
                  Unsaved changes
                </Badge>
              )}
            </div>
            <CardDescription>{description ?? entry.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">{children(form)}</CardContent>
          <CardFooter className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Last updated <DateDisplay value={entry.updatedAt} mode="relative" />. Changes apply to the app
              immediately.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
                disabled={!dirty || update.isPending}
              >
                <RotateCcw /> Reset
              </Button>
              <Button type="submit" disabled={!dirty || update.isPending}>
                {update.isPending && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

/** Shown when a stored value doesn't have the expected shape: read-only, so nothing gets overwritten blindly. */
export function UnrecognizedConfig({ entry, title }: { entry: ConfigEntry; title?: string }) {
  return (
    <Card id={`config-${entry.key}`} className="scroll-mt-20">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{title ?? entry.key}</CardTitle>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {entry.key}
          </code>
          <Badge variant="secondary">Read-only</Badge>
        </div>
        <CardDescription>
          {entry.description ??
            'This value has a shape the admin panel doesn’t recognise, so it is shown read-only.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
          {JSON.stringify(entry.value, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
