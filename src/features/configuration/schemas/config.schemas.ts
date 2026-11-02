import { z } from 'zod'
import { hexColorSchema, notNull } from '@/lib/forms'
import type {
  ArticlesConfig,
  CaptchaConfig,
  CheckInConfig,
  LeaderboardConfig,
  QuizConfig,
  QuizTypeConfig,
  ReferralConfig,
  ScratchCardConfig,
  SignupConfig,
  SpinWheelConfig,
  SupportConfig,
  WalletConfig,
} from '../types/config.types'

/**
 * Two kinds of schema per key:
 * - `stored*`: the shape the backend stores, used to read `entry.value` safely (unknown JSON from the API);
 * - `*Form`: what the admin edits, with the same limits the backend's BusinessConfig enforces.
 * Number inputs are `number | null` while editing (an empty box is null), hence `num()`.
 */

/** Whole number field: required, with bounds. */
function num(
  label: string,
  { min = 0, max, integer = true }: { min?: number; max?: number; integer?: boolean } = {},
) {
  let schema = z.number({ error: `${label} is required.` })
  if (integer) schema = schema.int(`${label} must be a whole number.`)
  schema = schema.min(min, `${label} must be at least ${min}.`)
  if (max !== undefined) schema = schema.max(max, `${label} must be at most ${max}.`)
  return schema.nullable().refine(notNull, `${label} is required.`)
}

const n = (value: number | null) => value ?? 0

// ---- check_in ----
export const storedCheckIn = z.object({ cycle: z.array(z.number()).min(1) })
export const checkInForm = z.object({
  cycle: z.array(z.object({ coins: num('Coins') })).min(1, 'Add at least one day.'),
})
export type CheckInForm = z.infer<typeof checkInForm>
export const checkInToForm = (value: CheckInConfig): CheckInForm => ({
  cycle: value.cycle.map((coins) => ({ coins })),
})
export const checkInToValue = (form: CheckInForm): CheckInConfig => ({
  cycle: form.cycle.map((day) => n(day.coins)),
})

// ---- spin_wheel ----
export const storedSpinWheel = z.object({
  maxSpinsPerDay: z.number(),
  segments: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        coins: z.number(),
        color: z.string(),
        weight: z.number(),
      }),
    )
    .min(1),
})
export const spinWheelForm = z
  .object({
    maxSpinsPerDay: num('Spins per day'),
    segments: z
      .array(
        z.object({
          id: z.string().trim().min(1, 'ID is required.'),
          label: z.string().trim().min(1, 'Label is required.').max(20),
          coins: num('Coins'),
          color: hexColorSchema,
          weight: num('Weight'),
        }),
      )
      .min(1, 'Add at least one segment.'),
  })
  .superRefine((values, ctx) => {
    const total = values.segments.reduce((sum, segment) => sum + (segment.weight ?? 0), 0)
    if (total <= 0)
      ctx.addIssue({
        code: 'custom',
        path: ['segments'],
        message: 'At least one segment needs a weight above 0.',
      })
    const seen = new Set<string>()
    values.segments.forEach((segment, index) => {
      const id = segment.id.trim()
      if (id && seen.has(id))
        ctx.addIssue({ code: 'custom', path: ['segments', index, 'id'], message: 'IDs must be unique.' })
      seen.add(id)
    })
  })
export type SpinWheelForm = z.infer<typeof spinWheelForm>
export const spinWheelToForm = (value: SpinWheelConfig): SpinWheelForm => ({
  maxSpinsPerDay: value.maxSpinsPerDay,
  segments: value.segments.map((segment) => ({ ...segment })),
})
export const spinWheelToValue = (form: SpinWheelForm): SpinWheelConfig => ({
  maxSpinsPerDay: n(form.maxSpinsPerDay),
  segments: form.segments.map((segment) => ({
    id: segment.id.trim(),
    label: segment.label.trim(),
    coins: n(segment.coins),
    color: segment.color.toUpperCase(),
    weight: n(segment.weight),
  })),
})

// ---- scratch_card ----
export const storedScratchCard = z.object({ cardsPerDay: z.number(), prizes: z.array(z.number()).min(1) })
export const scratchCardForm = z.object({
  cardsPerDay: num('Cards per day'),
  prizes: z.array(z.object({ coins: num('Prize') })).min(1, 'Add at least one prize.'),
})
export type ScratchCardForm = z.infer<typeof scratchCardForm>
export const scratchCardToForm = (value: ScratchCardConfig): ScratchCardForm => ({
  cardsPerDay: value.cardsPerDay,
  prizes: value.prizes.map((coins) => ({ coins })),
})
export const scratchCardToValue = (form: ScratchCardForm): ScratchCardConfig => ({
  cardsPerDay: n(form.cardsPerDay),
  prizes: form.prizes.map((prize) => n(prize.coins)),
})

// ---- captcha ----
export const storedCaptcha = z.object({
  rewardCoins: z.number(),
  attemptsPerDay: z.number(),
  ttlSeconds: z.number(),
  length: z.number(),
})
export const captchaForm = z.object({
  rewardCoins: num('Reward'),
  attemptsPerDay: num('Attempts per day'),
  ttlSeconds: num('Expiry', { min: 30 }),
  length: num('Length', { min: 4, max: 10 }),
})
export type CaptchaForm = z.infer<typeof captchaForm>
export const captchaToValue = (form: CaptchaForm): CaptchaConfig => ({
  rewardCoins: n(form.rewardCoins),
  attemptsPerDay: n(form.attemptsPerDay),
  ttlSeconds: n(form.ttlSeconds),
  length: n(form.length),
})

// ---- quiz ----
const storedQuizType = z.object({
  title: z.string(),
  subtitle: z.string(),
  rewardPerCorrect: z.number(),
  questionCount: z.number(),
  secondsPerQuestion: z.number(),
  attemptsPerDay: z.number(),
  imageUrl: z.string().nullable().optional(),
})
export const storedQuiz = z.object({
  daily: storedQuizType,
  math: storedQuizType,
  giveAnswer: storedQuizType,
})
const quizTypeForm = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(80),
  subtitle: z.string().trim().max(160),
  rewardPerCorrect: num('Reward per correct answer'),
  questionCount: num('Questions', { min: 1, max: 50 }),
  secondsPerQuestion: num('Seconds per question'),
  attemptsPerDay: num('Attempts per day'),
  imageUrl: z.string().nullable(),
})
export const quizForm = z.object({ daily: quizTypeForm, math: quizTypeForm, giveAnswer: quizTypeForm })
export type QuizForm = z.infer<typeof quizForm>
export const quizToForm = (value: z.infer<typeof storedQuiz>): QuizForm => ({
  daily: { ...value.daily, imageUrl: value.daily.imageUrl ?? null },
  math: { ...value.math, imageUrl: value.math.imageUrl ?? null },
  giveAnswer: { ...value.giveAnswer, imageUrl: value.giveAnswer.imageUrl ?? null },
})
const quizTypeToValue = (form: QuizForm['daily']): QuizTypeConfig => ({
  title: form.title.trim(),
  subtitle: form.subtitle.trim(),
  rewardPerCorrect: n(form.rewardPerCorrect),
  questionCount: n(form.questionCount),
  secondsPerQuestion: n(form.secondsPerQuestion),
  attemptsPerDay: n(form.attemptsPerDay),
  imageUrl: form.imageUrl,
})
export const quizToValue = (form: QuizForm): QuizConfig => ({
  daily: quizTypeToValue(form.daily),
  math: quizTypeToValue(form.math),
  giveAnswer: quizTypeToValue(form.giveAnswer),
})

// ---- articles ----
export const storedArticles = z.object({ dailyLimit: z.number() })
export const articlesForm = z.object({ dailyLimit: num('Daily limit') })
export type ArticlesForm = z.infer<typeof articlesForm>
export const articlesToValue = (form: ArticlesForm): ArticlesConfig => ({ dailyLimit: n(form.dailyLimit) })

// ---- wallet ----
export const storedWallet = z.object({
  coinsPerCurrencyUnit: z.number(),
  currencySymbol: z.string(),
  minRedeemCoins: z.number(),
  maxRedemptionsPerDay: z.number(),
})
export const walletForm = z.object({
  coinsPerCurrencyUnit: num('Coins per currency unit', { min: 1 }),
  currencySymbol: z.string().trim().min(1, 'Currency symbol is required.').max(8),
  minRedeemCoins: num('Minimum redemption', { min: 1 }),
  maxRedemptionsPerDay: num('Redemptions per day'),
})
export type WalletForm = z.infer<typeof walletForm>
export const walletToValue = (form: WalletForm): WalletConfig => ({
  coinsPerCurrencyUnit: n(form.coinsPerCurrencyUnit),
  currencySymbol: form.currencySymbol.trim(),
  minRedeemCoins: n(form.minRedeemCoins),
  maxRedemptionsPerDay: n(form.maxRedemptionsPerDay),
})

// ---- referral ----
export const storedReferral = z.object({
  rewardPerReferral: z.number(),
  refereeBonus: z.number(),
  maxReferralsPerDay: z.number(),
  shareBaseUrl: z.string(),
  shareMessage: z.string(),
  blockedEmailDomains: z.array(z.string()).nullable().optional(),
})
export const referralForm = z.object({
  rewardPerReferral: num('Referrer reward'),
  refereeBonus: num('New user bonus'),
  maxReferralsPerDay: num('Referrals per day'),
  shareBaseUrl: z
    .string()
    .trim()
    .min(1, 'Share link is required.')
    .regex(/^https?:\/\/\S+$/, 'Must be a web link.'),
  shareMessage: z.string().trim().min(1, 'Share message is required.').max(500),
  /** One domain per line. */
  blockedEmailDomains: z
    .string()
    .refine(
      (text) => parseLines(text).every((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)),
      'Enter one domain per line, e.g. mailinator.com.',
    ),
})
export type ReferralForm = z.infer<typeof referralForm>
export function parseLines(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean)
}
export const referralToForm = (value: z.infer<typeof storedReferral>): ReferralForm => ({
  ...value,
  blockedEmailDomains: (value.blockedEmailDomains ?? []).join('\n'),
})
export const referralToValue = (form: ReferralForm): ReferralConfig => ({
  rewardPerReferral: n(form.rewardPerReferral),
  refereeBonus: n(form.refereeBonus),
  maxReferralsPerDay: n(form.maxReferralsPerDay),
  shareBaseUrl: form.shareBaseUrl.trim(),
  shareMessage: form.shareMessage.trim(),
  blockedEmailDomains: [...new Set(parseLines(form.blockedEmailDomains))],
})

// ---- signup ----
export const storedSignup = z.object({ welcomeBonus: z.number() })
export const signupForm = z.object({ welcomeBonus: num('Welcome bonus') })
export type SignupForm = z.infer<typeof signupForm>
export const signupToValue = (form: SignupForm): SignupConfig => ({ welcomeBonus: n(form.welcomeBonus) })

// ---- leaderboard ----
export const storedLeaderboard = z.object({
  topN: z.number(),
  excludedSources: z.array(z.string()).nullable().optional(),
})
export const leaderboardForm = z.object({
  topN: num('Leaderboard size', { min: 1, max: 500 }),
  excludedSources: z.array(z.string()),
})
export type LeaderboardForm = z.infer<typeof leaderboardForm>
export const leaderboardToForm = (value: z.infer<typeof storedLeaderboard>): LeaderboardForm => ({
  topN: value.topN,
  excludedSources: value.excludedSources ?? [],
})
export const leaderboardToValue = (form: LeaderboardForm): LeaderboardConfig => ({
  topN: n(form.topN),
  excludedSources: form.excludedSources,
})

// ---- support ----
export const storedSupport = z.object({
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  chatUrl: z.string().nullable().optional(),
  workingHours: z.string().nullable().optional(),
})
export const supportForm = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address.'),
  phone: z.string().trim().max(30),
  chatUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), 'Must be a web link.'),
  workingHours: z.string().trim().max(120),
})
export type SupportForm = z.infer<typeof supportForm>
export const supportToForm = (value: z.infer<typeof storedSupport>): SupportForm => ({
  email: value.email ?? '',
  phone: value.phone ?? '',
  chatUrl: value.chatUrl ?? '',
  workingHours: value.workingHours ?? '',
})
export const supportToValue = (form: SupportForm): SupportConfig => ({
  email: form.email.trim() || null,
  phone: form.phone.trim() || null,
  chatUrl: form.chatUrl.trim() || null,
  workingHours: form.workingHours.trim() || null,
})
