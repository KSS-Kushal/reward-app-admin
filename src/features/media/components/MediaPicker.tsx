import { Check, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { FilterSelect } from '@/components/common/FilterSelect'
import { ImagePreview } from '@/components/common/ImagePreview'
import { EmptyState, ErrorState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useMediaList } from '../api/queries'
import { MEDIA_FOLDER_LABELS, MEDIA_FOLDERS, type MediaAsset, type MediaFolder } from '../types/media.types'
import { ImageUploader } from './ImageUploader'

const FOLDER_OPTIONS = MEDIA_FOLDERS.map((folder) => ({ value: folder, label: MEDIA_FOLDER_LABELS[folder] }))
const PICKER_PAGE_SIZE = 24

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Folder for uploads and the initial library filter. */
  folder: MediaFolder
  onSelect: (asset: MediaAsset) => void
  selectedUrl?: string | null
}

/** Choose an image from the media library or upload a new one. */
export function MediaPicker({ open, onOpenChange, folder, onSelect, selectedUrl }: MediaPickerProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [filter, setFilter] = useState<MediaFolder | ''>(folder)
  const [page, setPage] = useState(1)
  const query = useMediaList({ folder: filter, page, limit: PICKER_PAGE_SIZE }, open && tab === 'library')

  const choose = (asset: MediaAsset) => {
    onSelect(asset)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Pick an existing image from the media library or upload a new one.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'library' | 'upload')}>
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload new</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-4 pt-2">
            <FilterSelect
              label="Folder"
              allLabel="All folders"
              value={filter}
              onChange={(value) => {
                setFilter(value as MediaFolder | '')
                setPage(1)
              }}
              options={FOLDER_OPTIONS}
            />
            {query.isError ? (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            ) : query.isLoading ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => (
                  <Skeleton key={index} className="aspect-square" />
                ))}
              </div>
            ) : query.data && query.data.items.length > 0 ? (
              <>
                <ul
                  className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
                  aria-label="Media library"
                >
                  {query.data.items.map((asset) => {
                    const selected = asset.url === selectedUrl
                    return (
                      <li key={asset.id}>
                        <button
                          type="button"
                          onClick={() => choose(asset)}
                          className={cn(
                            'group relative block aspect-square w-full overflow-hidden rounded-md border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            selected ? 'border-primary' : 'border-transparent hover:border-primary/50',
                          )}
                          aria-label={`Select ${asset.originalName ?? 'image'}`}
                          aria-pressed={selected}
                        >
                          <ImagePreview
                            src={asset.url}
                            alt={asset.originalName ?? ''}
                            className="size-full rounded-none border-0"
                          />
                          {selected && (
                            <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {query.data.totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                    Page {query.data.currentPage} of {query.data.totalPages}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={!query.data.hasNext}
                      onClick={() => setPage((current) => current + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="No images here yet"
                description="Upload an image to use it here."
                action={
                  <Button size="sm" onClick={() => setTab('upload')}>
                    Upload image
                  </Button>
                }
              />
            )}
          </TabsContent>
          <TabsContent value="upload" className="pt-2">
            <p className="mb-3 text-sm text-muted-foreground">
              Uploads go to the{' '}
              <span className="font-medium text-foreground">{MEDIA_FOLDER_LABELS[folder]}</span> folder.
            </p>
            <ImageUploader folder={folder} onUploaded={choose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
