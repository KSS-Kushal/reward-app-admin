import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BannerPreviewProps {
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  tag?: string | null
  gradient?: [string, string] | null
  hasAction?: boolean
  compact?: boolean
  className?: string
}

const HEX = /^#[0-9A-Fa-f]{6}$/

/** Approximation of the banner card in the mobile app's home carousel. */
export function BannerPreview({
  title,
  subtitle,
  imageUrl,
  tag,
  gradient,
  hasAction,
  compact,
  className,
}: BannerPreviewProps) {
  const validGradient = gradient && HEX.test(gradient[0]) && HEX.test(gradient[1]) ? gradient : null
  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-2xl border text-slate-900',
        compact ? 'h-12 w-24 rounded-lg' : 'min-h-36 w-full',
        !validGradient && 'bg-muted',
        className,
      )}
      style={
        validGradient
          ? { backgroundImage: `linear-gradient(135deg, ${validGradient[0]}, ${validGradient[1]})` }
          : undefined
      }
      aria-label={compact ? `Preview of ${title}` : undefined}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className={cn('absolute inset-y-0 right-0 h-full object-cover', validGradient ? 'w-2/5' : 'w-full')}
        />
      )}
      {!compact && (
        <div className="relative z-10 flex max-w-[62%] flex-col justify-center gap-1.5 p-5">
          {tag && (
            <span className="w-fit rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {tag}
            </span>
          )}
          <p className="text-lg leading-tight font-bold break-words">{title || 'Banner title'}</p>
          {subtitle && <p className="text-sm leading-snug opacity-80">{subtitle}</p>}
          {hasAction && (
            <span className="mt-1 inline-flex w-fit items-center gap-0.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
              Open <ChevronRight className="size-3" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
