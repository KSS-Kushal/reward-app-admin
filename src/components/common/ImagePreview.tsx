import { ImageOff, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ImagePreviewProps {
  src: string | null | undefined
  alt: string
  className?: string
  /** `cover` crops to fill; `contain` shows the whole image. */
  fit?: 'cover' | 'contain'
}

/** Lazy-loaded image with placeholder and broken-image fallback. */
export function ImagePreview({ src, alt, className, fit = 'cover' }: ImagePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = Boolean(src) && failedSrc === src

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
        />
      ) : failed ? (
        <ImageOff
          className="size-1/3 max-h-8 max-w-8 text-muted-foreground"
          aria-label="Image failed to load"
        />
      ) : (
        <ImageIcon className="size-1/3 max-h-8 max-w-8 text-muted-foreground/60" aria-label="No image" />
      )}
    </div>
  )
}
