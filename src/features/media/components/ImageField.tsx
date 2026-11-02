import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { ImagePreview } from '@/components/common/ImagePreview'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { MediaFolder } from '../types/media.types'
import { MediaPicker } from './MediaPicker'

interface ImageInputProps {
  value: string | null | undefined
  onChange: (url: string | null) => void
  folder: MediaFolder
  /** Preview box shape. */
  aspect?: 'square' | 'wide'
  disabled?: boolean
}

/** Image chooser: preview plus "choose / replace / remove". URLs come only from the media API. */
export function ImageInput({ value, onChange, folder, aspect = 'square', disabled }: ImageInputProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-start gap-4">
      <ImagePreview
        src={value}
        alt="Selected image"
        className={cn(aspect === 'wide' ? 'aspect-[16/9] w-40' : 'size-24')}
      />
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
          {value ? <RefreshCw /> : <ImagePlus />}
          {value ? 'Replace image' : 'Choose image'}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="justify-start text-muted-foreground"
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        folder={folder}
        selectedUrl={value}
        onSelect={(asset) => onChange(asset.url)}
      />
    </div>
  )
}

interface ImageFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  folder: MediaFolder
  aspect?: 'square' | 'wide'
  className?: string
}

export function ImageField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  folder,
  aspect,
  className,
}: ImageFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div ref={field.ref} tabIndex={-1}>
              <ImageInput value={field.value} onChange={field.onChange} folder={folder} aspect={aspect} />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
