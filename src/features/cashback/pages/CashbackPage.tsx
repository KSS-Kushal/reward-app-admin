import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Clock, Info, ShieldCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CurrencyDisplay, Mono } from '@/components/common/display'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { NumberField, TextField } from '@/components/form/fields'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { MerchantPicker } from '@/features/merchants/components/MerchantPicker'
import { formatCoins, formatDateTime } from '@/lib/format'
import { applyServerErrors, notNull } from '@/lib/forms'
import type { CashbackRef } from '../api/cashback.api'
import { useCancelCashback, useConfirmCashback, useRecordCashback } from '../api/mutations'

const recordSchema = z.object({
  merchantId: z.string().min(1, 'Choose the store.'),
  subId: z.string().trim().min(1, 'Sub ID is required.'),
  orderRef: z.string().trim().min(1, 'Order reference is required.').max(120),
  orderAmount: z
    .number({ error: 'Order amount is required.' })
    .min(0, "Order amount can't be negative.")
    .nullable()
    .refine(notNull, 'Order amount is required.'),
  cashbackCoins: z
    .number({ error: 'Cashback is required.' })
    .int('Coins are whole numbers.')
    .min(1, 'Cashback must be at least 1 coin.')
    .nullable()
    .refine(notNull, 'Cashback is required.'),
})
type RecordValues = z.infer<typeof recordSchema>

const settleSchema = z.object({
  merchantId: z.string().min(1, 'Choose the store.'),
  orderRef: z.string().trim().min(1, 'Order reference is required.').max(120),
})
type SettleValues = z.infer<typeof settleSchema>

type LogStatus = 'pending' | 'completed' | 'failed'
interface LogEntry extends CashbackRef {
  status: LogStatus
  coins?: number
  amount?: number
  at: string
}

function MerchantField<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>
  name: FieldPath<T>
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>
            Merchant
            <span className="text-destructive" aria-hidden>
              *
            </span>
          </FormLabel>
          <FormControl>
            <MerchantPicker
              value={field.value || null}
              onChange={(id) => field.onChange(id ?? '')}
              className="sm:w-full"
              aria-invalid={Boolean(fieldState.error)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CashbackPage() {
  const record = useRecordCashback()
  const confirm = useConfirmCashback()
  const cancel = useCancelCashback()
  const [log, setLog] = useState<LogEntry[]>([])
  const [settling, setSettling] = useState<{ action: 'confirm' | 'cancel'; ref: CashbackRef } | null>(null)

  const recordForm = useForm<RecordValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { merchantId: '', subId: '', orderRef: '', orderAmount: null, cashbackCoins: null },
  })
  const settleForm = useForm<SettleValues>({
    resolver: zodResolver(settleSchema),
    defaultValues: { merchantId: '', orderRef: '' },
  })

  const upsertLog = (entry: LogEntry) =>
    setLog((current) =>
      [
        entry,
        ...current.filter(
          (item) => !(item.merchantId === entry.merchantId && item.orderRef === entry.orderRef),
        ),
      ].slice(0, 20),
    )

  const onRecord = recordForm.handleSubmit(async (values) => {
    const body = {
      ...values,
      subId: values.subId.trim(),
      orderRef: values.orderRef.trim(),
      orderAmount: values.orderAmount ?? 0,
      cashbackCoins: values.cashbackCoins ?? 0,
    }
    try {
      await record.mutateAsync(body)
      upsertLog({
        merchantId: body.merchantId,
        orderRef: body.orderRef,
        status: 'pending',
        coins: body.cashbackCoins,
        amount: body.orderAmount,
        at: new Date().toISOString(),
      })
      recordForm.reset({
        merchantId: body.merchantId,
        subId: '',
        orderRef: '',
        orderAmount: null,
        cashbackCoins: null,
      })
    } catch (error) {
      applyServerErrors(recordForm, error)
    }
  })

  const onSettle = (action: 'confirm' | 'cancel') =>
    settleForm.handleSubmit((values) =>
      setSettling({ action, ref: { merchantId: values.merchantId, orderRef: values.orderRef.trim() } }),
    )

  const runSettle = async () => {
    if (!settling) return
    const mutation = settling.action === 'confirm' ? confirm : cancel
    try {
      await mutation.mutateAsync(settling.ref)
    } catch (error) {
      applyServerErrors(settleForm, error)
      throw error
    }
    const previous = log.find(
      (item) => item.merchantId === settling.ref.merchantId && item.orderRef === settling.ref.orderRef,
    )
    upsertLog({
      ...previous,
      ...settling.ref,
      status: settling.action === 'confirm' ? 'completed' : 'failed',
      at: new Date().toISOString(),
    })
    settleForm.reset({ merchantId: settling.ref.merchantId, orderRef: '' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashback"
        description="Record affiliate orders as pending cashback, then confirm or cancel them once the network settles."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Clock, title: '1. Record order', text: 'Creates a pending credit in the user’s wallet.' },
          {
            icon: CheckCircle2,
            title: '2a. Confirm',
            text: 'The network approved it: the coins become available.',
          },
          { icon: XCircle, title: '2b. Cancel', text: 'Returned or rejected: the pending credit fails.' },
        ].map((step, index) => (
          <div key={step.title} className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <step.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.text}</p>
            </div>
            {index === 0 && (
              <ArrowRight
                className="ml-auto hidden size-4 self-center text-muted-foreground sm:block"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      <Alert>
        <ShieldCheck />
        <AlertTitle>Duplicate processing is prevented</AlertTitle>
        <AlertDescription>
          Each order is identified by its merchant and order reference. Recording, confirming or cancelling
          the same order again has no further effect, so it's safe to retry.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record order</CardTitle>
            <CardDescription>From the affiliate network's report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...recordForm}>
              <form onSubmit={onRecord} className="space-y-4" noValidate>
                <MerchantField control={recordForm.control} name="merchantId" />
                <TextField
                  control={recordForm.control}
                  name="subId"
                  label="Sub ID"
                  required
                  inputClassName="font-mono"
                  description="The user's affiliate id, as reported by the network."
                />
                <TextField
                  control={recordForm.control}
                  name="orderRef"
                  label="Order reference"
                  required
                  maxLength={120}
                  inputClassName="font-mono"
                  placeholder="ORD-1"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    control={recordForm.control}
                    name="orderAmount"
                    label="Order amount"
                    required
                    min={0}
                    step="any"
                    suffix="₹"
                  />
                  <NumberField
                    control={recordForm.control}
                    name="cashbackCoins"
                    label="Cashback"
                    required
                    min={1}
                    suffix="coins"
                  />
                </div>
                <Button type="submit" disabled={record.isPending} className="w-full sm:w-auto">
                  Record as pending
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settle order</CardTitle>
            <CardDescription>Confirm or cancel a recorded order.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...settleForm}>
              <form className="space-y-4" noValidate onSubmit={(event) => event.preventDefault()}>
                <MerchantField control={settleForm.control} name="merchantId" />
                <TextField
                  control={settleForm.control}
                  name="orderRef"
                  label="Order reference"
                  required
                  maxLength={120}
                  inputClassName="font-mono"
                  placeholder="ORD-1"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={onSettle('confirm')}
                    disabled={confirm.isPending || cancel.isPending}
                  >
                    <CheckCircle2 /> Confirm cashback
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={onSettle('cancel')}
                    disabled={confirm.isPending || cancel.isPending}
                  >
                    <XCircle /> Cancel cashback
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This session</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Info className="size-3.5" aria-hidden /> Orders you handled since opening this page. All changes
            are also in the audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="divide-y">
              {log.map((entry) => (
                <li
                  key={`${entry.merchantId}/${entry.orderRef}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm"
                >
                  <StatusBadge status={entry.status} />
                  <span>
                    <Mono>{entry.orderRef}</Mono> <span className="text-muted-foreground">at</span>{' '}
                    {entry.merchantId}
                  </span>
                  {entry.coins !== undefined && (
                    <span className="text-muted-foreground">{formatCoins(entry.coins)}</span>
                  )}
                  {entry.amount !== undefined && (
                    <CurrencyDisplay value={entry.amount} className="text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</span>
                  {entry.status === 'pending' && (
                    <span className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSettling({ action: 'confirm', ref: entry })}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setSettling({ action: 'cancel', ref: entry })}
                      >
                        Cancel
                      </Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={settling !== null}
        onOpenChange={(open) => !open && setSettling(null)}
        title={settling?.action === 'confirm' ? 'Confirm cashback?' : 'Cancel cashback?'}
        description={
          <>
            <p>
              Order <Mono>{settling?.ref.orderRef}</Mono> at{' '}
              <span className="font-medium text-foreground">{settling?.ref.merchantId}</span>.
            </p>
            <p>
              {settling?.action === 'confirm'
                ? 'The pending coins become available in the user’s wallet.'
                : 'The pending credit is marked as failed and the user won’t receive these coins.'}
            </p>
          </>
        }
        confirmLabel={settling?.action === 'confirm' ? 'Confirm cashback' : 'Cancel cashback'}
        destructive={settling?.action === 'cancel'}
        pending={confirm.isPending || cancel.isPending}
        onConfirm={runSettle}
      />
    </div>
  )
}
