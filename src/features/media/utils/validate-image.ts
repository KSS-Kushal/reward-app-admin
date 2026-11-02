import { formatBytes } from '@/lib/format'
import { MEDIA_ACCEPTED_TYPES, MEDIA_MAX_BYTES } from '../types/media.types'

/** Client-side checks mirroring the backend rules, so obviously bad files never get sent. */
export function validateImageFile(file: File): string | null {
  if (!(MEDIA_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'Please choose a JPEG, PNG or WebP image.'
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return `This image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MEDIA_MAX_BYTES)}.`
  }
  if (file.size === 0) return 'This file is empty.'
  return null
}
