import { useWatch, type Control } from 'react-hook-form'
import { NumberField, TextareaField, TextField } from '@/components/form/fields'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { formatNumber } from '@/lib/format'
import {
  leaderboardForm,
  leaderboardToForm,
  leaderboardToValue,
  referralForm,
  referralToForm,
  referralToValue,
  signupForm,
  signupToValue,
  storedLeaderboard,
  storedReferral,
  storedSignup,
  storedSupport,
  storedWallet,
  supportForm,
  supportToForm,
  supportToValue,
  walletForm,
  walletToValue,
  type ReferralForm,
  type WalletForm,
} from '../schemas/config.schemas'
import { TRANSACTION_SOURCES, type ConfigEntry } from '../types/config.types'
import { ConfigCard, UnrecognizedConfig } from './ConfigCard'

// ---- Wallet ----

function ConversionHint({ control }: { control: Control<WalletForm> }) {
  const [rate, symbol, minimum] = useWatch({
    control,
    name: ['coinsPerCurrencyUnit', 'currencySymbol', 'minRedeemCoins'],
  })
  if (!rate || rate <= 0) return null
  return (
    <p className="rounded-md bg-muted px-3 py-2 text-sm">
      {formatNumber(rate)} coins = {symbol}1
      {minimum ? (
        <>
          {' '}
          · minimum redemption {formatNumber(minimum)} coins = {symbol}
          {(minimum / rate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </>
      ) : null}
    </p>
  )
}

export function WalletSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedWallet.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Wallet" />
  return (
    <ConfigCard
      entry={entry}
      title="Wallet"
      schema={walletForm}
      defaultValues={parsed.data}
      toValue={walletToValue}
    >
      {(form) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField
              control={form.control}
              name="coinsPerCurrencyUnit"
              label="Coins per currency unit"
              min={1}
            />
            <TextField
              control={form.control}
              name="currencySymbol"
              label="Currency symbol"
              required
              maxLength={8}
            />
            <NumberField
              control={form.control}
              name="minRedeemCoins"
              label="Minimum redemption"
              min={1}
              suffix="coins"
            />
            <NumberField
              control={form.control}
              name="maxRedemptionsPerDay"
              label="Redemptions per day"
              min={0}
            />
          </div>
          <ConversionHint control={form.control} />
        </>
      )}
    </ConfigCard>
  )
}

// ---- Referral ----

function SharePreview({ control }: { control: Control<ReferralForm> }) {
  const [message, baseUrl, bonus] = useWatch({
    control,
    name: ['shareMessage', 'shareBaseUrl', 'refereeBonus'],
  })
  const code = 'RITIK250'
  const preview = message
    .replaceAll('{code}', code)
    .replaceAll('{bonus}', String(bonus ?? 0))
    .replaceAll('{link}', `${baseUrl}${code}`)
  return (
    <div className="space-y-1 rounded-md bg-muted px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">Preview</p>
      <p className="text-sm break-words">{preview}</p>
    </div>
  )
}

export function ReferralSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedReferral.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Referrals" />
  return (
    <ConfigCard
      entry={entry}
      title="Referrals"
      schema={referralForm}
      defaultValues={referralToForm(parsed.data)}
      toValue={referralToValue}
    >
      {(form) => (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              control={form.control}
              name="rewardPerReferral"
              label="Referrer reward"
              min={0}
              suffix="coins"
            />
            <NumberField
              control={form.control}
              name="refereeBonus"
              label="New user bonus"
              min={0}
              suffix="coins"
            />
            <NumberField
              control={form.control}
              name="maxReferralsPerDay"
              label="Referrals per day"
              min={0}
              description="Per referrer, against abuse."
            />
          </div>
          <TextField
            control={form.control}
            name="shareBaseUrl"
            label="Invite link base"
            required
            type="url"
            description="The referral code is appended, e.g. https://kavodnik.app/invite/CODE."
          />
          <TextareaField
            control={form.control}
            name="shareMessage"
            label="Share message"
            required
            rows={3}
            maxLength={500}
            description="Placeholders: {code}, {bonus} and {link}."
          />
          <SharePreview control={form.control} />
          <TextareaField
            control={form.control}
            name="blockedEmailDomains"
            label="Blocked email domains"
            rows={5}
            textareaClassName="font-mono text-xs"
            description="One per line. Sign-ups from these domains don't earn referral rewards."
          />
        </>
      )}
    </ConfigCard>
  )
}

// ---- Sign-up ----

export function SignupSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedSignup.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Sign-up" />
  return (
    <ConfigCard
      entry={entry}
      title="Sign-up"
      schema={signupForm}
      defaultValues={parsed.data}
      toValue={signupToValue}
    >
      {(form) => (
        <NumberField
          control={form.control}
          name="welcomeBonus"
          label="Welcome bonus"
          min={0}
          suffix="coins"
          className="max-w-60"
        />
      )}
    </ConfigCard>
  )
}

// ---- Leaderboard ----

export function LeaderboardSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedLeaderboard.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Leaderboard" />
  return (
    <ConfigCard
      entry={entry}
      title="Leaderboard"
      schema={leaderboardForm}
      defaultValues={leaderboardToForm(parsed.data)}
      toValue={leaderboardToValue}
    >
      {(form) => (
        <>
          <NumberField
            control={form.control}
            name="topN"
            label="Leaderboard size"
            min={1}
            max={500}
            description="Users shown, 1–500."
            className="max-w-60"
          />
          <FormField
            control={form.control}
            name="excludedSources"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excluded earnings</FormLabel>
                <FormDescription>Coins from these sources don't count as leaderboard points.</FormDescription>
                <div className="grid gap-2 pt-1 sm:grid-cols-3">
                  {TRANSACTION_SOURCES.map((source) => {
                    const checked = field.value.includes(source.value)
                    return (
                      <label
                        key={source.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm"
                      >
                        <FormControl>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) =>
                              field.onChange(
                                next
                                  ? [...field.value, source.value]
                                  : field.value.filter((value) => value !== source.value),
                              )
                            }
                          />
                        </FormControl>
                        {source.label}
                      </label>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </ConfigCard>
  )
}

// ---- Support ----

export function SupportSection({ entry }: { entry: ConfigEntry }) {
  const parsed = storedSupport.safeParse(entry.value)
  if (!parsed.success) return <UnrecognizedConfig entry={entry} title="Support contact" />
  return (
    <ConfigCard
      entry={entry}
      title="Support contact"
      description="Shown on the app's Contact Us screen with the FAQs."
      schema={supportForm}
      defaultValues={supportToForm(parsed.data)}
      toValue={supportToValue}
    >
      {(form) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="support@kavodnik.app"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone"
            type="tel"
            placeholder="+91 80 4000 1234"
          />
          <TextField
            control={form.control}
            name="chatUrl"
            label="Chat link"
            type="url"
            placeholder="https://wa.me/918040001234"
          />
          <TextField
            control={form.control}
            name="workingHours"
            label="Working hours"
            placeholder="Mon – Sat, 10:00 AM – 7:00 PM IST"
          />
        </div>
      )}
    </ConfigCard>
  )
}
