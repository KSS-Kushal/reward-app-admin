import type { PageParams } from '@/lib/api/types'

/** Placement switches the app reads, with the formats each one supports. A missing switch counts as on. */
export const AD_PLACEMENTS = {
  captcha: ['banner'],
  quiz: ['banner', 'native'],
  article: ['banner', 'native'],
  screenChange: ['interstitial'],
} as const

export type AdPlacement = keyof typeof AD_PLACEMENTS
export type AdFormat = 'banner' | 'native' | 'interstitial'
export type Placements = Record<string, Record<string, boolean>>

export interface AdMobSettings {
  enabled: boolean
  weight: number
  rewardedId: string
  interstitialId: string
  bannerId: string
  nativeId: string
}

export interface UnitySettings {
  enabled: boolean
  weight: number
  gameId: string
  testMode: boolean
  rewardedId: string
  interstitialId: string
  bannerId: string
}

export interface UserRef {
  id: string
  name: string
}

/** `GET /admin/ads/config`. The Unity secret is never returned, only `hasS2sSecret`. */
export interface AdminAdSettings {
  enabled: boolean
  version: number
  networks: {
    admob: AdMobSettings
    unity: UnitySettings & { hasS2sSecret: boolean }
  }
  interstitial: { everyScreens: number; minIntervalSeconds: number; warmupSeconds: number }
  rewardedLoadTimeoutSeconds: number
  placements: Placements
  rewards: { requireAdVerification: boolean }
  captcha: { cooldownSeconds: number }
  callbackUrls: { admob: string; unity: string }
  lastAcceptedCallbackAt: { admob: string | null; unity: string | null } | null
  warnings: string[] | null
  updatedAt: string | null
  updatedBy: UserRef | null
}

/**
 * `PUT /admin/ads/config`. `s2sSecret`: null keeps the saved secret, "" clears it, any other value replaces it.
 * `version` is the one loaded (optimistic locking).
 */
export interface SaveAdSettingsRequest {
  version: number
  note: string | null
  enabled: boolean
  networks: {
    admob: AdMobSettings
    unity: UnitySettings & { s2sSecret: string | null }
  }
  interstitial: AdminAdSettings['interstitial']
  rewardedLoadTimeoutSeconds: number
  placements: Placements
  rewards: AdminAdSettings['rewards']
  captcha: AdminAdSettings['captcha']
}

export interface AdSettingsChange {
  field: string
  from: unknown
  to: unknown
}

export interface AdSettingsHistoryItem {
  version: number
  note: string | null
  changedAt: string
  changedBy: UserRef | null
  changes: AdSettingsChange[]
}

// ---- Stats ----

export interface AdStatsParams {
  /** yyyy-MM-dd, inclusive, business timezone. Default: last 7 days. */
  from?: string
  to?: string
}

export interface AdStats {
  from: string
  to: string
  totals: {
    claimsCreated: number
    claimsCompleted: number
    claimsExpired: number
    /** 0–1. */
    completionRate: number
    coinsCredited: number
    callbacksReceived: number
    callbacksRejected: number
    notVerifiedResponses: number
  }
  /** Also lists `manual` / `disabled` completions when present. */
  byNetwork: {
    network: string
    claimsCompleted: number
    callbacksReceived: number
    callbacksRejected: number
  }[]
  bySource: { source: string; claimsCreated: number; claimsCompleted: number; coinsCredited: number }[]
  series: { date: string; claimsCreated: number; claimsCompleted: number }[]
}

// ---- Callback log ----

export const CALLBACK_NETWORKS = ['admob', 'unity'] as const
export type CallbackNetwork = (typeof CALLBACK_NETWORKS)[number]
export const CALLBACK_RESULTS = ['accepted', 'duplicate', 'rejected'] as const
export type CallbackResult = (typeof CALLBACK_RESULTS)[number]

export interface AdCallback {
  id: number
  network: CallbackNetwork
  result: CallbackResult
  /** INVALID_SIGNATURE | UNKNOWN_CLAIM | CLAIM_NOT_PENDING | DUPLICATE | MISSING_SECRET | MISSING_TRANSACTION_ID */
  reason: string | null
  claimId: string | null
  transactionId: string | null
  rawQuery: string | null
  receivedAt: string
}

export interface CallbackListParams extends PageParams {
  network?: CallbackNetwork | ''
  result?: CallbackResult | ''
  from?: string
  to?: string
}

export const AD_NETWORK_LABELS: Record<string, string> = {
  admob: 'AdMob',
  unity: 'Unity Ads',
  manual: 'Manual',
  disabled: 'No ad (ads off)',
}

export const CLAIM_SOURCE_LABELS: Record<string, string> = {
  checkIn: 'Daily check-in',
  spinWheel: 'Spin wheel',
  scratchCard: 'Scratch card',
}
