import { Star } from 'lucide-react'
import { ImagePreview } from '@/components/common/ImagePreview'
import { formatCurrency } from '@/lib/format'

interface ProductCardProps {
  name: string
  imageUrl: string | null
  price: number | null
  originalPrice: number | null
  currencySymbol: string
  rating: number | null
  rewardText: string | null
}

/** Approximation of a product tile in the app's product grid. */
export function ProductCard({
  name,
  imageUrl,
  price,
  originalPrice,
  currencySymbol,
  rating,
  rewardText,
}: ProductCardProps) {
  const discount =
    price !== null && originalPrice !== null && originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null
  return (
    <div className="w-full max-w-56 overflow-hidden rounded-xl border bg-card">
      <ImagePreview
        src={imageUrl}
        alt=""
        fit="contain"
        className="aspect-square w-full rounded-none border-0 bg-white"
      />
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm leading-snug font-medium">{name || 'Product name'}</p>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="font-semibold">
            {price !== null ? formatCurrency(price, currencySymbol || '₹') : '—'}
          </span>
          {originalPrice !== null && discount !== null && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(originalPrice, currencySymbol || '₹')}
              </span>
              <span className="text-xs font-medium text-success">{discount}% off</span>
            </>
          )}
        </div>
        {rating !== null && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-warning text-warning" aria-hidden /> {rating.toFixed(1)}
          </p>
        )}
        {rewardText && <p className="text-xs font-medium text-primary">{rewardText}</p>}
        <div className="mt-2 rounded-md bg-primary py-1.5 text-center text-xs font-medium text-primary-foreground">
          Buy now
        </div>
      </div>
    </div>
  )
}
