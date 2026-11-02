import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2, Info, KeyRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm, useWatch, type Control, type FieldPath } from 'react-hook-form'
import { CopyButton } from '@/components/common/CopyButton'
import { DateDisplay, Mono } from '@/components/common/display'
import { NumberField, SwitchField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Slider } from '@/components/ui/slider'
import { applyServerErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import {
  adSettingsSchema,
  settingsToForm,
  sharePreview,
  type AdSettingsFormValues,
} from '../schemas/ad-settings.schema'
import { AD_PLACEMENTS, type AdFormat, type AdminAdSettings } from '../types/ads.types'

type Control_ = Control<AdSettingsFormValues>

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function WeightField({
  control,
  name,
  label,
}: {
  control: Control_
  name: FieldPath<AdSettingsFormValues>
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === 'number' ? field.value : 0
        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              <span className="text-sm font-medium tabular-nums">{value}</span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[value]}
                onValueChange={([next]) => field.onChange(next ?? 0)}
                aria-label={label}
              />
            </FormControl>
            <FormDescription>Relative share of impressions; 0 = not used.</FormDescription>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

function ReadOnlyUrl({ label, url, hint }: { label: string; url: string; hint: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-1">
        <Mono className="block flex-1 truncate py-1.5">{url}</Mono>
        <CopyButton value={url} label={`Copy ${label}`} />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function SharePreview({ control }: { control: Control_ }) {
  const networks = useWatch({ control, name: 'networks' })
  const share = sharePreview({ networks })
  const total = share.admob + share.unity
  return (
    <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
      <p className="text-sm font-medium">
        {total === 0 ? 'No network is serving ads' : `AdMob ${share.admob}% · Unity ${share.unity}%`}
      </p>
      {total > 0 && (
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {share.admob > 0 && (
            <div
              className="h-full rounded-l-full bg-series-1 last:rounded-r-full"
              style={{ width: `${share.admob}%` }}
            />
          )}
          {share.unity > 0 && (
            <div
              className="h-full rounded-r-full bg-series-2 first:rounded-l-full"
              style={{ width: `${share.unity}%` }}
            />
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        If one network has no ad at that moment, the other is tried. Unity has no native ads; native always
        uses AdMob.
      </p>
    </div>
  )
}

const PLACEMENT_ROWS: { key: keyof typeof AD_PLACEMENTS; label: string }[] = [
  { key: 'captcha', label: 'Captcha' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'article', label: 'Articles' },
  { key: 'screenChange', label: 'Between screens' },
]
const FORMAT_COLUMNS: { key: AdFormat; label: string }[] = [
  { key: 'banner', label: 'Banner' },
  { key: 'native', label: 'Native' },
  { key: 'interstitial', label: 'Interstitial' },
]

function PlacementsMatrix({ control }: { control: Control_ }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Screen
            </th>
            {FORMAT_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className="px-3 py-2 text-center font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLACEMENT_ROWS.map((row) => (
            <tr key={row.key} className="border-t">
              <th scope="row" className="px-3 py-2.5 text-left font-normal">
                {row.label}
              </th>
              {FORMAT_COLUMNS.map((column) => {
                const supported = (AD_PLACEMENTS[row.key] as readonly string[]).includes(column.key)
                return (
                  <td key={column.key} className="px-3 py-2.5 text-center">
                    {supported ? (
                      <FormField
                        control={control}
                        name={`placements.${row.key}.${column.key}`}
                        render={({ field }) => (
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            aria-label={`${row.label}: ${column.label}`}
                          />
                        )}
                      />
                    ) : (
                      <span className="text-muted-foreground/50" aria-label="Not available">
                        —
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SecretField({ control, hasSecret }: { control: Control_; hasSecret: boolean }) {
  const clear = useWatch({ control, name: 'networks.unity.clearSecret' })
  return (
    <div className="space-y-3 sm:col-span-2">
      <FormField
        control={control}
        name="networks.unity.s2sSecret"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              S2S secret
              {hasSecret && !clear && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Saved
                </span>
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  className="pl-8"
                  disabled={clear}
                  placeholder={
                    hasSecret
                      ? 'Leave empty to keep the saved secret'
                      : 'Paste the secret from the Unity dashboard'
                  }
                />
              </div>
            </FormControl>
            <FormDescription>
              Write-only: the server never sends it back. It's stored encrypted.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {hasSecret && (
        <FormField
          control={control}
          name="networks.unity.clearSecret"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              Remove the saved secret
            </label>
          )}
        />
      )}
    </div>
  )
}

function LastCallback({ label, at }: { label: string; at: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span>{label}</span>
      {at ? (
        <span className="inline-flex items-center gap-1.5 text-success">
          <CheckCircle2 className="size-4" aria-hidden /> <DateDisplay value={at} mode="relative" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <AlertTriangle className="size-4" aria-hidden /> No accepted callback yet
        </span>
      )}
    </div>
  )
}

interface AdSettingsFormProps {
  settings: AdminAdSettings
  pending: boolean
  onSubmit: (values: AdSettingsFormValues) => Promise<unknown>
}

export function AdSettingsForm({ settings, pending, onSubmit }: AdSettingsFormProps) {
  const form = useForm<AdSettingsFormValues>({
    resolver: zodResolver(adSettingsSchema),
    defaultValues: settingsToForm(settings),
  })
  const [enabled, admobEnabled, unityEnabled] = useWatch({
    control: form.control,
    name: ['enabled', 'networks.admob.enabled', 'networks.unity.enabled'],
  })
  const networksError =
    form.formState.errors.networks?.message ?? form.formState.errors.networks?.root?.message

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

        <Section title="General">
          <SwitchField
            control={form.control}
            name="enabled"
            label="Ads enabled"
            description="Off = no ads anywhere. Check-in, spin and scratch coins are then given without an ad."
          />
          {!enabled && (
            <Alert>
              <Info />
              <AlertDescription>
                The app shows no ads. The settings below are kept for when you turn ads back on.
              </AlertDescription>
            </Alert>
          )}
          <NumberField
            control={form.control}
            name="rewardedLoadTimeoutSeconds"
            label="Rewarded ad wait"
            min={3}
            max={30}
            suffix="sec"
            className="max-w-60"
            description="How long “Watch ad & collect” waits for an ad that is still loading (3–30)."
          />
        </Section>

        {networksError && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{networksError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="AdMob">
            <SwitchField control={form.control} name="networks.admob.enabled" label="Enabled" />
            <fieldset disabled={!admobEnabled} className={cn('space-y-4', !admobEnabled && 'opacity-60')}>
              <WeightField control={form.control} name="networks.admob.weight" label="Share" />
              <TextField
                control={form.control}
                name="networks.admob.rewardedId"
                label="Rewarded unit id"
                placeholder="ca-app-pub-…/…"
                inputClassName="font-mono text-xs"
                description="Required for rewards (check-in, spin, scratch)."
              />
              <TextField
                control={form.control}
                name="networks.admob.interstitialId"
                label="Interstitial unit id"
                placeholder="ca-app-pub-…/…"
                inputClassName="font-mono text-xs"
              />
              <TextField
                control={form.control}
                name="networks.admob.bannerId"
                label="Banner unit id"
                placeholder="ca-app-pub-…/…"
                inputClassName="font-mono text-xs"
              />
              <TextField
                control={form.control}
                name="networks.admob.nativeId"
                label="Native unit id"
                placeholder="ca-app-pub-…/…"
                inputClassName="font-mono text-xs"
                description="Native advanced unit. An empty id turns that format off for AdMob."
              />
            </fieldset>
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm">
                <span className="font-medium">App id</span>{' '}
                <span className="text-muted-foreground">
                  is set in the app build (<Mono>ADMOB_APP_ID</Mono>); changing it needs a new release.
                </span>
              </p>
              <ReadOnlyUrl
                label="SSV callback URL"
                url={settings.callbackUrls.admob}
                hint="Paste into AdMob → rewarded unit → Server-side verification."
              />
            </div>
          </Section>

          <Section title="Unity Ads">
            <SwitchField control={form.control} name="networks.unity.enabled" label="Enabled" />
            <fieldset
              disabled={!unityEnabled}
              className={cn('grid gap-4 sm:grid-cols-2', !unityEnabled && 'opacity-60')}
            >
              <div className="sm:col-span-2">
                <WeightField control={form.control} name="networks.unity.weight" label="Share" />
              </div>
              <TextField
                control={form.control}
                name="networks.unity.gameId"
                label="Android game id"
                placeholder="5712345"
                inputClassName="font-mono"
              />
              <SwitchField
                control={form.control}
                name="networks.unity.testMode"
                label="Test mode"
                description="Keep off in production."
                className="self-end"
              />
              <TextField
                control={form.control}
                name="networks.unity.rewardedId"
                label="Rewarded placement id"
                inputClassName="font-mono text-xs"
              />
              <TextField
                control={form.control}
                name="networks.unity.interstitialId"
                label="Interstitial placement id"
                inputClassName="font-mono text-xs"
              />
              <TextField
                control={form.control}
                name="networks.unity.bannerId"
                label="Banner placement id"
                inputClassName="font-mono text-xs"
              />
              <SecretField control={form.control} hasSecret={settings.networks.unity.hasS2sSecret} />
            </fieldset>
            <div className="border-t pt-4">
              <ReadOnlyUrl
                label="S2S callback URL"
                url={settings.callbackUrls.unity}
                hint="Enable server-to-server redeem callbacks in the Unity dashboard with this URL."
              />
            </div>
          </Section>
        </div>

        <SharePreview control={form.control} />

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Interstitials"
            description="An interstitial shows only when all three conditions allow it."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                control={form.control}
                name="interstitial.everyScreens"
                label="Every N screen changes"
                min={1}
                max={50}
                description="1–50"
              />
              <NumberField
                control={form.control}
                name="interstitial.minIntervalSeconds"
                label="Min seconds between full-screen ads"
                min={0}
                max={3600}
                description="Counts rewarded ads too."
              />
              <NumberField
                control={form.control}
                name="interstitial.warmupSeconds"
                label="None for the first N seconds"
                min={0}
                max={600}
                description="After app start."
              />
            </div>
          </Section>

          <Section
            title="Placements"
            description="Per-screen switches. Rewarded ads for check-in, spin and scratch can't be switched off here."
          >
            <PlacementsMatrix control={form.control} />
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Rewards">
            <SwitchField
              control={form.control}
              name="rewards.requireAdVerification"
              label="Require verified ad"
              description="Coins are credited only after AdMob or Unity confirms the ad was watched. Turn on once both callback URLs are set."
            />
            <FormField
              control={form.control}
              name="rewards.requireAdVerification"
              render={() => <FormMessage />}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Last accepted callback</p>
              <LastCallback label="AdMob" at={settings.lastAcceptedCallbackAt?.admob} />
              <LastCallback label="Unity" at={settings.lastAcceptedCallbackAt?.unity} />
            </div>
          </Section>

          <Section title="Captcha">
            <NumberField
              control={form.control}
              name="captcha.cooldownSeconds"
              label="Cooldown between captchas"
              min={0}
              max={300}
              suffix="sec"
              className="max-w-60"
              description="0–300 seconds after each answer."
            />
          </Section>
        </div>

        <Section title="Save">
          <TextField
            control={form.control}
            name="note"
            label="Change note"
            maxLength={500}
            placeholder="e.g. Shift share to AdMob for Diwali week"
            description="Optional. Shown in the change history."
          />
        </Section>

        <FormActions submitLabel="Save settings" pending={pending} disabled={!form.formState.isDirty} sticky>
          {form.formState.isDirty && (
            <span className="mr-auto text-sm text-muted-foreground">Unsaved changes</span>
          )}
        </FormActions>
      </form>
    </Form>
  )
}
