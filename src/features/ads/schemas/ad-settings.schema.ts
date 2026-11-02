import { z } from 'zod'
import { notNull } from '@/lib/forms'
import {
  AD_PLACEMENTS,
  type AdminAdSettings,
  type AdStats,
  type Placements,
  type SaveAdSettingsRequest,
} from '../types/ads.types'

/**
 * Form for `PUT /admin/ads/config`. Field paths mirror the request body, so the backend's error keys
 * (`networks.admob.rewardedId`, `interstitial.everyScreens`, …) land on the right inputs.
 * The rules mirror the backend's; it stays the authority.
 */
const ADMOB_UNIT = /^ca-app-pub-\d{16}\/\d{10}$/
const UNITY_PLACEMENT = /^[A-Za-z0-9_-]{1,64}$/

const range = (min: number, max: number) =>
  z
    .number({ error: 'Required.' })
    .int('Use a whole number.')
    .min(min, `Must be between ${min} and ${max}`)
    .max(max, `Must be between ${min} and ${max}`)
    .nullable()
    .refine(notNull, 'Required.')

const admobUnit = z
  .string()
  .trim()
  .refine((value) => value === '' || ADMOB_UNIT.test(value), 'Not a valid AdMob ad unit id')
const unityPlacement = z
  .string()
  .trim()
  .refine((value) => value === '' || UNITY_PLACEMENT.test(value), "Use 1-64 letters, digits, '_' or '-'")

export const adSettingsSchema = z
  .object({
    note: z.string().max(500, 'At most 500 characters'),
    enabled: z.boolean(),
    networks: z.object({
      admob: z.object({
        enabled: z.boolean(),
        weight: range(0, 100),
        rewardedId: admobUnit,
        interstitialId: admobUnit,
        bannerId: admobUnit,
        nativeId: admobUnit,
      }),
      unity: z.object({
        enabled: z.boolean(),
        weight: range(0, 100),
        gameId: z
          .string()
          .trim()
          .refine((value) => value === '' || /^\d{1,20}$/.test(value), 'Digits only'),
        testMode: z.boolean(),
        rewardedId: unityPlacement,
        interstitialId: unityPlacement,
        bannerId: unityPlacement,
        /** New secret; empty keeps the saved one. */
        s2sSecret: z.string().max(200, 'At most 200 characters'),
        clearSecret: z.boolean(),
      }),
    }),
    interstitial: z.object({
      everyScreens: range(1, 50),
      minIntervalSeconds: range(0, 3600),
      warmupSeconds: range(0, 600),
    }),
    rewardedLoadTimeoutSeconds: range(3, 30),
    placements: z.record(z.string(), z.record(z.string(), z.boolean())),
    rewards: z.object({ requireAdVerification: z.boolean() }),
    captcha: z.object({ cooldownSeconds: range(0, 300) }),
    /** Read-only context for validation: whether the server already holds a Unity secret. */
    hasS2sSecret: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const { admob, unity } = values.networks
    if (unity.enabled) {
      for (const field of ['gameId', 'rewardedId', 'interstitialId', 'bannerId'] as const) {
        if (!unity[field].trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['networks', 'unity', field],
            message: 'Required when Unity is enabled',
          })
        }
      }
    }
    if (values.enabled) {
      const usable =
        (admob.enabled && (admob.weight ?? 0) > 0 && admob.rewardedId.trim() !== '') ||
        (unity.enabled && (unity.weight ?? 0) > 0 && unity.rewardedId.trim() !== '')
      if (!usable) {
        ctx.addIssue({
          code: 'custom',
          path: ['networks'],
          message: 'Enable at least one network with a share above 0 and a rewarded ad unit.',
        })
      }
    }
    const willHaveSecret = unity.s2sSecret.trim() !== '' || (values.hasS2sSecret && !unity.clearSecret)
    if (values.rewards.requireAdVerification && unity.enabled && !willHaveSecret) {
      ctx.addIssue({
        code: 'custom',
        path: ['rewards', 'requireAdVerification'],
        message: 'Unity is enabled but has no S2S secret, so its rewarded ads could never be verified.',
      })
    }
  })

export type AdSettingsFormValues = z.infer<typeof adSettingsSchema>

/** Every known switch, defaulting to on when the stored map doesn't mention it (the app's rule). */
export function fullPlacements(stored: Placements | null | undefined): Placements {
  return Object.fromEntries(
    Object.entries(AD_PLACEMENTS).map(([placement, formats]) => [
      placement,
      Object.fromEntries(formats.map((format) => [format, stored?.[placement]?.[format] ?? true])),
    ]),
  )
}

export function settingsToForm(settings: AdminAdSettings): AdSettingsFormValues {
  const { admob, unity } = settings.networks
  return {
    note: '',
    enabled: settings.enabled,
    networks: {
      admob: {
        enabled: admob.enabled,
        weight: admob.weight,
        rewardedId: admob.rewardedId ?? '',
        interstitialId: admob.interstitialId ?? '',
        bannerId: admob.bannerId ?? '',
        nativeId: admob.nativeId ?? '',
      },
      unity: {
        enabled: unity.enabled,
        weight: unity.weight,
        gameId: unity.gameId ?? '',
        testMode: unity.testMode,
        rewardedId: unity.rewardedId || 'Rewarded_Android',
        interstitialId: unity.interstitialId || 'Interstitial_Android',
        bannerId: unity.bannerId || 'Banner_Android',
        s2sSecret: '',
        clearSecret: false,
      },
    },
    interstitial: { ...settings.interstitial },
    rewardedLoadTimeoutSeconds: settings.rewardedLoadTimeoutSeconds,
    placements: fullPlacements(settings.placements),
    rewards: { requireAdVerification: settings.rewards.requireAdVerification },
    captcha: { cooldownSeconds: settings.captcha.cooldownSeconds },
    hasS2sSecret: unity.hasS2sSecret,
  }
}

const n = (value: number | null) => value ?? 0

export function formToSaveRequest(values: AdSettingsFormValues, version: number): SaveAdSettingsRequest {
  const { admob, unity } = values.networks
  const secret = unity.s2sSecret.trim()
  return {
    version,
    note: values.note.trim() || null,
    enabled: values.enabled,
    networks: {
      admob: {
        enabled: admob.enabled,
        weight: n(admob.weight),
        rewardedId: admob.rewardedId.trim(),
        interstitialId: admob.interstitialId.trim(),
        bannerId: admob.bannerId.trim(),
        nativeId: admob.nativeId.trim(),
      },
      unity: {
        enabled: unity.enabled,
        weight: n(unity.weight),
        gameId: unity.gameId.trim(),
        testMode: unity.testMode,
        rewardedId: unity.rewardedId.trim(),
        interstitialId: unity.interstitialId.trim(),
        bannerId: unity.bannerId.trim(),
        // null keeps the saved secret, "" clears it, anything else replaces it.
        s2sSecret: secret ? secret : unity.clearSecret ? '' : null,
      },
    },
    interstitial: {
      everyScreens: n(values.interstitial.everyScreens),
      minIntervalSeconds: n(values.interstitial.minIntervalSeconds),
      warmupSeconds: n(values.interstitial.warmupSeconds),
    },
    rewardedLoadTimeoutSeconds: n(values.rewardedLoadTimeoutSeconds),
    placements: values.placements,
    rewards: values.rewards,
    captcha: { cooldownSeconds: n(values.captcha.cooldownSeconds) },
  }
}

/** "AdMob 70% · Unity 30%": each enabled network's share of impressions. */
export function sharePreview(values: Pick<AdSettingsFormValues, 'networks'>): {
  admob: number
  unity: number
} {
  const admob = values.networks.admob.enabled ? (values.networks.admob.weight ?? 0) : 0
  const unity = values.networks.unity.enabled ? (values.networks.unity.weight ?? 0) : 0
  const total = admob + unity
  if (total <= 0) return { admob: 0, unity: 0 }
  const admobShare = Math.round((admob / total) * 100)
  return { admob: admobShare, unity: 100 - admobShare }
}

/**
 * Many 409 AD_NOT_VERIFIED answers relative to completions usually means the callbacks are misconfigured
 * (the app retried and the network's confirmation never arrived).
 */
export function verificationLooksBroken(totals: AdStats['totals']): boolean {
  return (
    totals.notVerifiedResponses >= 20 &&
    totals.notVerifiedResponses / Math.max(totals.claimsCompleted, 1) >= 0.1
  )
}
