import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

const integerFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const decimalFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === 'string' ? parseISO(value) : value
  return isValid(date) ? date : null
}

/** `13 Oct 2026, 3:00 PM` in the viewer's time zone. API timestamps are UTC ISO-8601. */
export function formatDateTime(value: string | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  return date ? format(date, 'd MMM yyyy, h:mm a') : fallback
}

export function formatDate(value: string | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  return date ? format(date, 'd MMM yyyy') : fallback
}

/** `3 minutes ago`. */
export function formatRelative(value: string | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value)
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : fallback
}

export function isPast(value: string | null | undefined): boolean {
  const date = toDate(value)
  return date ? date.getTime() < Date.now() : false
}

/** Coins are integers; values are shown exactly as the API sends them. */
export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : integerFormat.format(value)
}

export function formatCoins(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${integerFormat.format(value)} ${Math.abs(value) === 1 ? 'coin' : 'coins'}`
}

export function formatCurrency(value: number | null | undefined, symbol = '₹'): string {
  return value == null ? '—' : `${symbol}${decimalFormat.format(value)}`
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (
    (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')
  ).toUpperCase()
}

export function shortId(id: string | null | undefined): string {
  if (!id) return '—'
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}
