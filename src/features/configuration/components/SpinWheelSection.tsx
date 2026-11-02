import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useWatch, type Control } from 'react-hook-form'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ColorPicker } from '@/components/common/ColorPicker'
import { NumberField } from '@/components/form/fields'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  spinWheelForm,
  spinWheelToForm,
  spinWheelToValue,
  storedSpinWheel,
  type SpinWheelForm,
} from '../schemas/config.schemas'
import type { ConfigEntry } from '../types/config.types'
import { ConfigCard, UnrecognizedConfig } from './ConfigCard'

function NumberCell({
  control,
  name,
  label,
}: {
  control: Control<SpinWheelForm>
  name: `segments.${number}.coins` | `segments.${number}.weight`
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label={label}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value ?? ''}
              onChange={(event) =>
                field.onChange(event.target.value === '' ? null : Number(event.target.value))
              }
              className="w-24 tabular-nums"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function Segments({ control }: { control: Control<SpinWheelForm> }) {
  const segments = useFieldArray({ control, name: 'segments' })
  const values = useWatch({ control, name: 'segments' })
  const totalWeight = values.reduce((sum, segment) => sum + (segment.weight ?? 0), 0)
  const expected =
    totalWeight > 0
      ? values.reduce((sum, segment) => sum + (segment.coins ?? 0) * (segment.weight ?? 0), 0) / totalWeight
      : 0
  const chartData = values
    .map((segment) => ({
      name: segment.label || segment.id,
      value: segment.weight ?? 0,
      color: segment.color,
    }))
    .filter((segment) => segment.value > 0)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Chance</TableHead>
                <TableHead className="sr-only">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.fields.map((field, index) => {
                const weight = values[index]?.weight ?? 0
                return (
                  <TableRow key={field.id} className="align-top">
                    <TableCell className="pt-4 text-muted-foreground tabular-nums">{index + 1}</TableCell>
                    <TableCell>
                      <FormField
                        control={control}
                        name={`segments.${index}.id`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...input}
                                aria-label={`Segment ${index + 1} id`}
                                className="w-20 font-mono text-xs"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={control}
                        name={`segments.${index}.label`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...input}
                                aria-label={`Segment ${index + 1} label`}
                                className="w-24"
                                maxLength={20}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <NumberCell
                        control={control}
                        name={`segments.${index}.coins`}
                        label={`Segment ${index + 1} coins`}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={control}
                        name={`segments.${index}.color`}
                        render={({ field: input, fieldState }) => (
                          <FormItem>
                            <FormControl>
                              <ColorPicker
                                value={input.value}
                                onChange={input.onChange}
                                className="w-36"
                                aria-invalid={Boolean(fieldState.error)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <NumberCell
                        control={control}
                        name={`segments.${index}.weight`}
                        label={`Segment ${index + 1} weight`}
                      />
                    </TableCell>
                    <TableCell className="pt-4 tabular-nums">
                      {totalWeight > 0 ? `${((weight / totalWeight) * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => segments.remove(index)}
                        disabled={segments.fields.length <= 1}
                        aria-label={`Remove segment ${index + 1}`}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              segments.append({
                id: `s${segments.fields.length + 1}`,
                label: '',
                coins: 0,
                color: '#6A4BE0',
                weight: 1,
              })
            }
            disabled={segments.fields.length >= 16}
          >
            <Plus /> Add segment
          </Button>
          <p className="text-sm text-muted-foreground">
            Expected payout per spin:{' '}
            <span className="font-medium text-foreground">{expected.toFixed(1)} coins</span>
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Chance per segment</p>
        <div className="h-52" role="img" aria-label="Pie chart of the chance of each segment">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="45%"
                outerRadius="90%"
                stroke="var(--background)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {chartData.map((segment, index) => (
                  <Cell
                    key={index}
                    fill={/^#[0-9A-Fa-f]{6}$/.test(segment.color) ? segment.color : 'var(--muted)'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `${totalWeight > 0 ? ((Number(value) / totalWeight) * 100).toFixed(1) : 0}%`
                }
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--popover-foreground)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">
          The wheel draws segments equally; weights only change the odds, and stay on the server.
        </p>
      </div>
    </div>
  )
}

export function SpinWheelSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedSpinWheel.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Spin wheel" />
  return (
    <ConfigCard
      entry={entry}
      title="Spin wheel"
      description="Segments in clockwise order from the top. A segment's chance is its weight divided by the total weight."
      schema={spinWheelForm}
      defaultValues={spinWheelToForm(parsed.data)}
      toValue={spinWheelToValue}
    >
      {(form) => (
        <>
          <NumberField
            control={form.control}
            name="maxSpinsPerDay"
            label="Spins per day"
            min={0}
            className="max-w-48"
          />
          <Segments control={form.control} />
          {(form.formState.errors.segments?.message ?? form.formState.errors.segments?.root?.message) && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.segments?.message ?? form.formState.errors.segments?.root?.message}
            </p>
          )}
        </>
      )}
    </ConfigCard>
  )
}
