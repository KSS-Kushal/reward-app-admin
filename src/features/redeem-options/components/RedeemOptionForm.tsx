import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { NumberField, SelectField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { applyServerErrors, emptyToNull, notNull, slugIdSchema } from '@/lib/forms'
import {
  REDEEM_METHOD_LABELS,
  REDEEM_METHODS,
  type RedeemOption,
  type RedeemOptionRequest,
} from '../types/redeem-option.types'

function compiles(pattern: string): boolean {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

const schema = z
  .object({
    id: slugIdSchema(40),
    method: z.enum(REDEEM_METHODS, { error: 'Method is required.' }),
    name: z.string().trim().min(1, 'Name is required.').max(80),
    description: z.string().trim().min(1, 'Description is required.').max(255),
    minCoins: z
      .number({ error: 'Minimum coins is required.' })
      .int('Coins are whole numbers.')
      .positive('Minimum coins must be positive.')
      .nullable()
      .refine(notNull, 'Minimum coins is required.'),
    processingTime: z.string().trim().min(1, 'Processing time is required.').max(80),
    accountLabel: z.string().trim().max(40),
    accountPattern: z
      .string()
      .trim()
      .max(255)
      .refine((value) => value === '' || compiles(value), 'Not a valid regular expression.'),
    accountError: z.string().trim().max(160),
    enabled: z.boolean(),
    sortOrder: z.number().int().nullable(),
  })
  .superRefine((values, ctx) => {
    if (!values.accountLabel && (values.accountPattern || values.accountError)) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountLabel'],
        message: 'Set an account label when you validate account details.',
      })
    }
  })
type FormValues = z.infer<typeof schema>

const METHOD_OPTIONS = REDEEM_METHODS.map((method) => ({
  value: method,
  label: REDEEM_METHOD_LABELS[method],
}))

/** Lets the admin try the account pattern before saving. */
function PatternTester({ pattern }: { pattern: string }) {
  const [sample, setSample] = useState('')
  if (!pattern || !compiles(pattern)) return null
  const matches = sample ? new RegExp(pattern).test(sample) : null
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <Label htmlFor="pattern-sample" className="text-xs text-muted-foreground">
        Try the pattern
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="pattern-sample"
          value={sample}
          onChange={(event) => setSample(event.target.value)}
          placeholder="ritik@upi"
          className="font-mono"
        />
        {matches === true && <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Valid" />}
        {matches === false && <XCircle className="size-5 shrink-0 text-destructive" aria-label="Invalid" />}
      </div>
    </div>
  )
}

export function RedeemOptionForm({
  option,
  nextSortOrder,
  onSubmit,
  onCancel,
  pending,
}: {
  option?: RedeemOption
  nextSortOrder: number
  onSubmit: (body: RedeemOptionRequest) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: option?.id ?? '',
      method: option?.method ?? 'upi',
      name: option?.name ?? '',
      description: option?.description ?? '',
      minCoins: option?.minCoins ?? 1000,
      processingTime: option?.processingTime ?? 'Within 24 hours',
      accountLabel: option?.accountLabel ?? '',
      accountPattern: option?.accountPattern ?? '',
      accountError: option?.accountError ?? '',
      enabled: option?.enabled ?? true,
      sortOrder: option?.sortOrder ?? nextSortOrder,
    },
  })
  const pattern = useWatch({ control: form.control, name: 'accountPattern' })

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({
        ...(!option && values.id ? { id: values.id } : {}),
        method: values.method,
        name: values.name.trim(),
        description: values.description.trim(),
        minCoins: values.minCoins ?? 0,
        processingTime: values.processingTime.trim(),
        accountLabel: emptyToNull(values.accountLabel),
        accountPattern: emptyToNull(values.accountPattern),
        accountError: emptyToNull(values.accountError),
        enabled: values.enabled,
        sortOrder: values.sortOrder ?? 0,
      })
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="method"
            label="Method"
            options={METHOD_OPTIONS}
            required
          />
          <TextField
            control={form.control}
            name="name"
            label="Name"
            required
            maxLength={80}
            placeholder="PhonePe UPI"
          />
        </div>
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          required
          rows={2}
          maxLength={255}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            control={form.control}
            name="minCoins"
            label="Minimum coins"
            required
            min={1}
            suffix="coins"
          />
          <TextField
            control={form.control}
            name="processingTime"
            label="Processing time"
            required
            maxLength={80}
          />
        </div>
        {!option && (
          <TextField
            control={form.control}
            name="id"
            label="ID"
            placeholder="redeem_phonepe"
            inputClassName="font-mono"
            description="Optional. Generated when empty."
          />
        )}

        <Separator />
        <div className="space-y-1">
          <p className="text-sm font-medium">Account details</p>
          <p className="text-sm text-muted-foreground">
            Leave the label empty when users don't need to enter anything (e.g. gift cards sent by email).
          </p>
        </div>
        <TextField
          control={form.control}
          name="accountLabel"
          label="Account label"
          maxLength={40}
          placeholder="UPI ID"
        />
        <TextField
          control={form.control}
          name="accountPattern"
          label="Validation pattern"
          maxLength={255}
          inputClassName="font-mono text-xs"
          placeholder="^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$"
          description="Regular expression the account details must match."
        />
        <PatternTester pattern={pattern} />
        <TextField
          control={form.control}
          name="accountError"
          label="Error message"
          maxLength={160}
          placeholder="Please enter a valid UPI ID."
        />

        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            control={form.control}
            name="sortOrder"
            label="Sort order"
            description="Lower numbers show first."
          />
          <SwitchField control={form.control} name="enabled" label="Enabled" className="self-start" />
        </div>
        <FormActions
          submitLabel={option ? 'Save changes' : 'Create redeem option'}
          pending={pending}
          onCancel={onCancel}
        />
      </form>
    </Form>
  )
}
