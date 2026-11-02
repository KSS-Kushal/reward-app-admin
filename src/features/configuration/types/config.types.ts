/** One `app_config` row. `value` is free-form JSON on the wire; each known key has a typed shape below. */
export interface ConfigEntry {
  key: string
  value: unknown
  description: string | null
  updatedAt: string
}

export const CONFIG_KEYS = [
  'check_in',
  'spin_wheel',
  'scratch_card',
  'captcha',
  'quiz',
  'articles',
  'wallet',
  'referral',
  'signup',
  'leaderboard',
  'support',
] as const
export type ConfigKey = (typeof CONFIG_KEYS)[number]

export interface CheckInConfig {
  /** Coins for consecutive days; the cycle repeats after the last entry. */
  cycle: number[]
}

export interface SpinSegment {
  id: string
  label: string
  coins: number
  color: string
  /** Relative chance; stays server-side. */
  weight: number
}

export interface SpinWheelConfig {
  maxSpinsPerDay: number
  /** Clockwise from the top. */
  segments: SpinSegment[]
}

export interface ScratchCardConfig {
  cardsPerDay: number
  /** Picked uniformly. */
  prizes: number[]
}

export interface CaptchaConfig {
  rewardCoins: number
  attemptsPerDay: number
  ttlSeconds: number
  length: number
}

export interface QuizTypeConfig {
  title: string
  subtitle: string
  rewardPerCorrect: number
  questionCount: number
  /** 0 = untimed. */
  secondsPerQuestion: number
  attemptsPerDay: number
  imageUrl: string | null
}

export interface QuizConfig {
  daily: QuizTypeConfig
  math: QuizTypeConfig
  giveAnswer: QuizTypeConfig
}

export interface ArticlesConfig {
  dailyLimit: number
}

export interface WalletConfig {
  coinsPerCurrencyUnit: number
  currencySymbol: string
  minRedeemCoins: number
  maxRedemptionsPerDay: number
}

export interface ReferralConfig {
  rewardPerReferral: number
  refereeBonus: number
  maxReferralsPerDay: number
  shareBaseUrl: string
  /** Placeholders: {code}, {bonus}, {link}. */
  shareMessage: string
  blockedEmailDomains: string[]
}

export interface SignupConfig {
  welcomeBonus: number
}

export interface LeaderboardConfig {
  topN: number
  /** Transaction sources that don't count as points, e.g. "shopping". */
  excludedSources: string[]
}

export interface SupportConfig {
  email: string | null
  phone: string | null
  chatUrl: string | null
  workingHours: string | null
}

export const TRANSACTION_SOURCES = [
  { value: 'checkIn', label: 'Daily check-in' },
  { value: 'spinWheel', label: 'Spin wheel' },
  { value: 'scratchCard', label: 'Scratch card' },
  { value: 'captcha', label: 'Captcha' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'article', label: 'Articles' },
  { value: 'shopping', label: 'Shopping cashback' },
  { value: 'referral', label: 'Referrals' },
  { value: 'bonus', label: 'Bonuses' },
] as const
