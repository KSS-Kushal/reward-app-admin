import { ExternalLink, ImageIcon, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { DataTableToolbar } from '@/components/common/DataTableToolbar'
import { DateDisplay } from '@/components/common/display'
import { FilterSelect } from '@/components/common/FilterSelect'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState, ErrorState, NoResults } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useListParams } from '@/hooks/use-list-params'
import { formatBytes } from '@/lib/format'
import { toast } from 'sonner'
import { useDeleteMedia } from '../api/mutations'
import { useMediaList } from '../api/queries'
import { ImageUploader } from '../components/ImageUploader'
import { MEDIA_FOLDER_LABELS, MEDIA_FOLDERS, type MediaAsset, type MediaFolder } from '../types/media.types'

const FOLDER_OPTIONS = MEDIA_FOLDERS.map((folder) => ({ value: folder, label: MEDIA_FOLDER_LABELS[folder] }))
const FILTER_KEYS = ['folder'] as const

function UploadDialog({
  open,
  onOpenChange,
  initialFolder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFolder: MediaFolder
}) {
  const [folder, setFolder] = useState<MediaFolder>(initialFolder)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload image</DialogTitle>
          <DialogDescription>Images are stored on ImageKit and can be used across the app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="upload-folder">Folder</Label>
          <Select value={folder} onValueChange={(value) => setFolder(value as MediaFolder)}>
            <SelectTrigger id="upload-folder" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ImageUploader
          folder={folder}
          onUploaded={() => {
            toast.success('Image uploaded successfully.')
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function MediaCard({ asset, onDelete }: { asset: MediaAsset; onDelete: () => void }) {
  return (
    <Card className="group gap-0 overflow-hidden py-0">
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer noopener"
        className="block bg-muted"
        aria-label={`Open ${asset.originalName ?? 'image'} in a new tab`}
      >
        <ImagePreview
          src={asset.url}
          alt={asset.originalName ?? ''}
          fit="contain"
          className="aspect-[4/3] w-full rounded-none border-0"
        />
      </a>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium" title={asset.originalName ?? asset.filePath}>
            {asset.originalName ?? asset.filePath.split('/').pop()}
          </p>
          <Badge variant="secondary" className="shrink-0">
            {MEDIA_FOLDER_LABELS[asset.folder] ?? asset.folder}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <dt className="sr-only">Dimensions</dt>
          <dd>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : 'Unknown size'}</dd>
          <dt className="sr-only">File size</dt>
          <dd className="text-right">{formatBytes(asset.sizeBytes)}</dd>
          <dt className="sr-only">Type</dt>
          <dd>{asset.contentType.replace('image/', '').toUpperCase()}</dd>
          <dt className="sr-only">Uploaded</dt>
          <dd className="text-right">
            <DateDisplay value={asset.createdAt} mode="relative" />
          </dd>
        </dl>
        <div className="flex items-center justify-end gap-1 border-t pt-2">
          <CopyButton value={asset.url} label="Copy URL" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" asChild>
                <a href={asset.url} target="_blank" rel="noreferrer noopener" aria-label="Open in new tab">
                  <ExternalLink />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={onDelete}
                aria-label="Delete"
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  )
}

export function MediaPage() {
  const { filters, page, limit, update, clear, hasFilters } = useListParams(FILTER_KEYS, 24)
  const folder = (MEDIA_FOLDERS as readonly string[]).includes(filters.folder)
    ? (filters.folder as MediaFolder)
    : ''
  const query = useMediaList({ folder, page, limit })
  const deleteMedia = useDeleteMedia()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Images stored on ImageKit for banners, articles, stores, products and more."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload /> Upload
          </Button>
        }
      />

      <DataTableToolbar hasFilters={hasFilters} onClear={clear}>
        <FilterSelect
          label="Folder"
          allLabel="All folders"
          value={folder}
          onChange={(value) => update({ folder: value })}
          options={FOLDER_OPTIONS}
        />
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-[4/5]" />
          ))}
        </div>
      ) : query.data && query.data.items.length > 0 ? (
        <ul
          className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${query.isPlaceholderData ? 'opacity-60' : ''}`}
          aria-label="Media"
        >
          {query.data.items.map((asset) => (
            <li key={asset.id}>
              <MediaCard asset={asset} onDelete={() => setToDelete(asset)} />
            </li>
          ))}
        </ul>
      ) : hasFilters ? (
        <NoResults what="images" onClear={clear} />
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No images yet"
          description="Upload images here, or straight from a banner, article or product form."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload /> Upload image
            </Button>
          }
        />
      )}

      <Pagination
        page={query.data}
        onPageChange={(next) => update({ page: next })}
        onLimitChange={(next) => update({ limit: next })}
        disabled={query.isFetching}
      />

      {uploadOpen && (
        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} initialFolder={folder || 'general'} />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete image?"
        description={
          <>
            <p>
              <span className="font-medium text-foreground">{toDelete?.originalName ?? 'This image'}</span>{' '}
              will be removed from the library and ImageKit.
            </p>
            <p>Images still used by a banner, article, store or product can't be deleted.</p>
          </>
        }
        confirmLabel="Delete image"
        destructive
        pending={deleteMedia.isPending}
        onConfirm={() => toDelete && deleteMedia.mutateAsync(toDelete.id)}
      />
    </div>
  )
}
