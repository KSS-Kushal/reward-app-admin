import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useWatch, type Control } from 'react-hook-form'
import { NumberField, TextField } from '@/components/form/fields'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ImageField } from '@/features/media/components/ImageField'
import { formatNumber } from '@/lib/format'
import {
  articlesForm,
  articlesToValue,
  captchaForm,
  captchaToValue,
  checkInForm,
  checkInToForm,
  checkInToValue,
  quizForm,
  quizToForm,
  quizToValue,
  scratchCardForm,
  scratchCardToForm,
  scratchCardToValue,
  storedArticles,
  storedCaptcha,
  storedCheckIn,
  storedQuiz,
  storedScratchCard,
  type CheckInForm,
  type QuizForm,
  type ScratchCardForm,
} from '../schemas/config.schemas'
import type { ConfigEntry } from '../types/config.types'
import { ConfigCard, UnrecognizedConfig } from './ConfigCard'

function ArrayError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

// ---- Daily check-in ----

function CheckInDays({ control }: { control: Control<CheckInForm> }) {
  const days = useFieldArray({ control, name: 'cycle' })
  const cycle = useWatch({ control, name: 'cycle' })
  const total = cycle.reduce((sum, day) => sum + (day.coins ?? 0), 0)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.fields.map((field, index) => (
          <div key={field.id} className="relative rounded-lg border p-3">
            <FormField
              control={control}
              name={`cycle.${index}.coins`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Day {index + 1}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      name={input.name}
                      ref={input.ref}
                      onBlur={input.onBlur}
                      value={input.value ?? ''}
                      onChange={(event) =>
                        input.onChange(event.target.value === '' ? null : Number(event.target.value))
                      }
                      className="tabular-nums"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {days.fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 size-6"
                onClick={() => days.remove(index)}
                aria-label={`Remove day ${index + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => days.append({ coins: 0 })}
          disabled={days.fields.length >= 31}
        >
          <Plus /> Add day
        </Button>
        <p className="text-sm text-muted-foreground">
          One full cycle pays <span className="font-medium text-foreground">{formatNumber(total)} coins</span>{' '}
          over {days.fields.length} days.
        </p>
      </div>
    </div>
  )
}

export function CheckInSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedCheckIn.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Daily check-in" />
  return (
    <ConfigCard
      entry={entry}
      title="Daily check-in"
      description="Coins for each consecutive day. Missing a day resets the streak; after the last day the cycle starts again."
      schema={checkInForm}
      defaultValues={checkInToForm(parsed.data)}
      toValue={checkInToValue}
    >
      {(form) => (
        <>
          <CheckInDays control={form.control} />
          <ArrayError
            message={form.formState.errors.cycle?.message ?? form.formState.errors.cycle?.root?.message}
          />
        </>
      )}
    </ConfigCard>
  )
}

// ---- Scratch card ----

function ScratchPrizes({ control }: { control: Control<ScratchCardForm> }) {
  const prizes = useFieldArray({ control, name: 'prizes' })
  const values = useWatch({ control, name: 'prizes' })
  const average = values.length
    ? values.reduce((sum, prize) => sum + (prize.coins ?? 0), 0) / values.length
    : 0
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Prizes</p>
      <div className="flex flex-wrap gap-2">
        {prizes.fields.map((field, index) => (
          <FormField
            key={field.id}
            control={control}
            name={`prizes.${index}.coins`}
            render={({ field: input }) => (
              <FormItem className="w-28">
                <div className="flex items-center gap-1">
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      aria-label={`Prize ${index + 1}`}
                      name={input.name}
                      ref={input.ref}
                      onBlur={input.onBlur}
                      value={input.value ?? ''}
                      onChange={(event) =>
                        input.onChange(event.target.value === '' ? null : Number(event.target.value))
                      }
                      className="tabular-nums"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => prizes.remove(index)}
                    disabled={prizes.fields.length <= 1}
                    aria-label={`Remove prize ${index + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => prizes.append({ coins: 0 })}
          aria-label="Add prize"
        >
          <Plus />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Each card reveals one prize at random, each equally likely (
        {values.length ? (100 / values.length).toFixed(1) : 0}%). Average prize:{' '}
        <span className="font-medium text-foreground">{average.toFixed(1)} coins</span>. Repeat a value to
        make it more likely.
      </p>
    </div>
  )
}

export function ScratchCardSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedScratchCard.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Scratch card" />
  return (
    <ConfigCard
      entry={entry}
      title="Scratch card"
      schema={scratchCardForm}
      defaultValues={scratchCardToForm(parsed.data)}
      toValue={scratchCardToValue}
    >
      {(form) => (
        <>
          <NumberField
            control={form.control}
            name="cardsPerDay"
            label="Cards per day"
            min={0}
            className="max-w-48"
          />
          <ScratchPrizes control={form.control} />
          <ArrayError
            message={form.formState.errors.prizes?.message ?? form.formState.errors.prizes?.root?.message}
          />
        </>
      )}
    </ConfigCard>
  )
}

// ---- Captcha ----

export function CaptchaSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedCaptcha.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Captcha" />
  return (
    <ConfigCard
      entry={entry}
      title="Captcha"
      schema={captchaForm}
      defaultValues={parsed.data}
      toValue={captchaToValue}
    >
      {(form) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField control={form.control} name="rewardCoins" label="Reward" min={0} suffix="coins" />
          <NumberField control={form.control} name="attemptsPerDay" label="Attempts per day" min={0} />
          <NumberField
            control={form.control}
            name="ttlSeconds"
            label="Expires after"
            min={30}
            suffix="sec"
            description="At least 30 seconds."
          />
          <NumberField
            control={form.control}
            name="length"
            label="Characters"
            min={4}
            max={10}
            description="4 to 10."
          />
        </div>
      )}
    </ConfigCard>
  )
}

// ---- Quiz ----

const QUIZ_GROUPS: { key: keyof QuizForm; title: string; note?: string }[] = [
  { key: 'daily', title: 'Daily quiz' },
  { key: 'math', title: 'Math quiz', note: 'Questions are generated automatically.' },
  { key: 'giveAnswer', title: 'Give answer' },
]

function QuizGroup({ control, group }: { control: Control<QuizForm>; group: (typeof QUIZ_GROUPS)[number] }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{group.title}</p>
        {group.note && <p className="text-sm text-muted-foreground">{group.note}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField control={control} name={`${group.key}.title`} label="Title" required maxLength={80} />
        <TextField
          control={control}
          name={`${group.key}.subtitle`}
          label="Subtitle"
          maxLength={160}
          className="lg:col-span-3"
        />
        <NumberField
          control={control}
          name={`${group.key}.rewardPerCorrect`}
          label="Reward per correct"
          min={0}
          suffix="coins"
        />
        <NumberField
          control={control}
          name={`${group.key}.questionCount`}
          label="Questions"
          min={1}
          max={50}
        />
        <NumberField
          control={control}
          name={`${group.key}.secondsPerQuestion`}
          label="Seconds per question"
          min={0}
          description="0 = untimed."
        />
        <NumberField
          control={control}
          name={`${group.key}.attemptsPerDay`}
          label="Attempts per day"
          min={0}
        />
      </div>
      <ImageField control={control} name={`${group.key}.imageUrl`} label="Card image" folder="quiz" />
    </div>
  )
}

export function QuizSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedQuiz.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Quizzes" />
  return (
    <ConfigCard
      entry={entry}
      title="Quizzes"
      schema={quizForm}
      defaultValues={quizToForm(parsed.data)}
      toValue={quizToValue}
    >
      {(form) =>
        QUIZ_GROUPS.map((group, index) => (
          <div key={group.key} className="space-y-6">
            {index > 0 && <Separator />}
            <QuizGroup control={form.control} group={group} />
          </div>
        ))
      }
    </ConfigCard>
  )
}

// ---- Articles ----

export function ArticlesSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedArticles.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Read & Earn" />
  return (
    <ConfigCard
      entry={entry}
      title="Read & Earn"
      schema={articlesForm}
      defaultValues={parsed.data}
      toValue={articlesToValue}
    >
      {(form) => (
        <NumberField
          control={form.control}
          name="dailyLimit"
          label="Article rewards per day"
          min={0}
          className="max-w-60"
          description="How many articles a user can be rewarded for each day."
        />
      )}
    </ConfigCard>
  )
}
