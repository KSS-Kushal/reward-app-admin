import { Pencil, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { CopyButton } from '@/components/common/CopyButton'
import { DateDisplay, DetailList, Mono } from '@/components/common/display'
import { ImagePreview } from '@/components/common/ImagePreview'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { BooleanBadge } from '@/components/common/StatusBadge'
import { useBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMerchantCategories } from '@/features/merchant-categories/api/hooks'
import { OffersPanel } from '@/features/offers/components/OffersPanel'
import { ProductsPanel } from '@/features/products/components/ProductsPanel'
import { useMerchant } from '../api/queries'
import { DeleteMerchantDialog } from '../components/DeleteMerchantDialog'
import { previewTrackingUrl } from '../schemas/merchant.schema'
import type { Merchant } from '../types/merchant.types'

type Tab = 'overview' | 'offers' | 'products'

function Overview({ merchant, categoryName }: { merchant: Merchant; categoryName: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-line">{merchant.description}</p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tracking URL template</p>
              <div className="flex items-start gap-1">
                <Mono className="block flex-1 py-1.5 break-all">{merchant.trackingUrlTemplate}</Mono>
                <CopyButton value={merchant.trackingUrlTemplate} label="Copy tracking URL" />
              </div>
              <p className="text-xs break-all text-muted-foreground">
                Users open: {previewTrackingUrl(merchant.trackingUrlTemplate)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Terms</CardTitle>
          </CardHeader>
          <CardContent>
            {merchant.terms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No terms.</p>
            ) : (
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {merchant.terms.map((term, index) => (
                  <li key={index}>{term}</li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: 'Category', value: categoryName },
              { label: 'Reward text', value: merchant.rewardText },
              { label: 'Cashback', value: `${merchant.cashbackPercent}%` },
              { label: 'Status', value: <BooleanBadge value={merchant.active} /> },
              { label: 'Featured', value: merchant.featured ? 'Yes' : 'No' },
              { label: 'Sort order', value: merchant.sortOrder },
              {
                label: 'Brand colour',
                value: merchant.brandColor ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-4 rounded border"
                      style={{ backgroundColor: merchant.brandColor }}
                      aria-hidden
                    />
                    <Mono>{merchant.brandColor}</Mono>
                  </span>
                ) : (
                  '—'
                ),
              },
              { label: 'ID', value: <Mono>{merchant.id}</Mono> },
              { label: 'Created', value: <DateDisplay value={merchant.createdAt} /> },
              { label: 'Updated', value: <DateDisplay value={merchant.updatedAt} /> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function MerchantDetailPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const query = useMerchant(id)
  const categories = useMerchantCategories()
  const [deleting, setDeleting] = useState(false)
  useBreadcrumbLabel(query.data?.name, `/admin/merchants/${id}`)

  const tab: Tab = pathname.endsWith('/offers')
    ? 'offers'
    : pathname.endsWith('/products')
      ? 'products'
      : 'overview'
  const base = `/admin/merchants/${id}`

  if (query.isLoading) return <PageSkeleton />
  if (query.isError || !query.data || !id) {
    return (
      <div className="space-y-6">
        <PageHeader title="Merchant" backTo="/admin/merchants" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const merchant = query.data
  const categoryName =
    categories.data?.find((category) => category.id === merchant.categoryId)?.name ?? merchant.categoryId

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/admin/merchants"
        title={
          <span className="flex items-center gap-3">
            <ImagePreview src={merchant.logoUrl} alt="" className="size-10" fit="contain" />
            <span className="truncate">{merchant.name}</span>
            {merchant.featured && (
              <Star className="size-5 shrink-0 fill-warning text-warning" aria-label="Featured" />
            )}
          </span>
        }
        description={`${categoryName} · ${merchant.rewardText}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`${base}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(true)}
            >
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(value) => navigate(value === 'overview' ? base : `${base}/${value}`)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && <Overview merchant={merchant} categoryName={categoryName} />}
      {tab === 'offers' && <OffersPanel merchantId={merchant.id} merchantName={merchant.name} />}
      {tab === 'products' && <ProductsPanel merchantId={merchant.id} />}

      <DeleteMerchantDialog
        merchant={deleting ? merchant : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/admin/merchants', { replace: true })}
      />
    </div>
  )
}
