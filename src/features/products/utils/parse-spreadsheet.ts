import { emptyProduct, type ProductFormValues } from '../schemas/product.schema'

/** Column order accepted when pasting rows from a spreadsheet. */
export const PASTE_COLUMNS = [
  'name',
  'price',
  'originalPrice',
  'affiliateUrl',
  'imageUrl',
  'rating',
  'rewardText',
] as const

function toNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[₹$,\s]/g, '')
  if (cleaned === '') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Parses rows copied from Excel/Google Sheets (tab-separated) or simple CSV (no quoted commas).
 * A first row whose price column isn't a number is treated as a header and skipped.
 */
export function parseSpreadsheet(text: string, startSortOrder = 0): ProductFormValues[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '')
  if (lines.length === 0) return []

  const delimiter = lines.some((line) => line.includes('\t')) ? '\t' : ','
  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()))
  const [first] = rows
  if (first && toNumber(first[1]) === null) rows.shift()

  return rows.map((cells, index) => {
    const [name, price, originalPrice, affiliateUrl, imageUrl, rating, rewardText] = cells
    return {
      ...emptyProduct(startSortOrder + index),
      name: name ?? '',
      price: toNumber(price),
      originalPrice: toNumber(originalPrice),
      affiliateUrl: affiliateUrl ?? '',
      imageUrl: imageUrl ? imageUrl : null,
      rating: toNumber(rating),
      rewardText: rewardText ?? '',
    }
  })
}
