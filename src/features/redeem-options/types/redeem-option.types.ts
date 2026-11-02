export const REDEEM_METHODS = ['upi', 'paytm', 'amazonPay', 'googlePlay'] as const
export type RedeemMethod = (typeof REDEEM_METHODS)[number]

export const REDEEM_METHOD_LABELS: Record<RedeemMethod, string> = {
  upi: 'UPI',
  paytm: 'Paytm',
  amazonPay: 'Amazon Pay',
  googlePlay: 'Google Play',
}

/** A payout method users can redeem coins with. */
export interface RedeemOption {
  id: string
  method: RedeemMethod
  name: string
  description: string
  minCoins: number
  processingTime: string
  /** When set, the user must enter account details (UPI ID, phone…). */
  accountLabel: string | null
  /** Regex the account details must match. */
  accountPattern: string | null
  accountError: string | null
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface RedeemOptionRequest {
  id?: string
  method: RedeemMethod
  name: string
  description: string
  minCoins: number
  processingTime: string
  accountLabel: string | null
  accountPattern: string | null
  accountError: string | null
  enabled: boolean
  sortOrder: number
}
