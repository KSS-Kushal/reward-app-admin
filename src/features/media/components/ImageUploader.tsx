import { AlertCircle, Loader2, UploadCloud, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getErrorMessage } from '@/lib/api/errors'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUploadMedia } from '../api/mutations'
import {
  MEDIA_ACCEPTED_TYPES,
  MEDIA_MAX_BYTES,
  type MediaAsset,
  type MediaFolder,
} from '../types/media.types'
import { validateImageFile } from '../utils/validate-image'

interface ImageUploaderProps {
  folder: MediaFolder
  onUploaded: (asset: MediaAsset) => void
  className?: string
}

export function ImageUploader({ folder, onUploaded, className }: ImageUploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadMedia()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => () => abortRef.current?.abort(), [])

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const start = async (selected: File) => {
    const problem = validateImageFile(selected)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setProgress(0)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const asset = await upload.mutateAsync({
        file: selected,
        folder,
        onProgress: setProgress,
        signal: controller.signal,
      })
      reset()
      onUploaded(asset)
    } catch (uploadError) {
      if (controller.signal.aborted) {
        reset()
        return
      }
      setError(getErrorMessage(uploadError, 'Upload failed. Please try again.'))
      setFile(null)
    } finally {
      abortRef.current = null
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (upload.isPending) return
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) void start(dropped)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && !upload.isPending) {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={upload.isPending ? -1 : 0}
        aria-disabled={upload.isPending}
        aria-describedby={`${inputId}-hint`}
        onClick={() => !upload.isPending && inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          upload.isPending && 'cursor-default',
        )}
      >
        {file && previewUrl ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <img src={previewUrl} alt="" className="max-h-28 rounded-md object-contain" />
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Upload progress" />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                abortRef.current?.abort()
              }}
            >
              <X /> Cancel upload
            </Button>
          </div>
        ) : (
          <>
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              {upload.isPending ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <UploadCloud className="size-5 text-primary" aria-hidden />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
                JPEG, PNG or WebP · up to {formatBytes(MEDIA_MAX_BYTES)}
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={MEDIA_ACCEPTED_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const selected = event.target.files?.[0]
            if (selected) void start(selected)
          }}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}
