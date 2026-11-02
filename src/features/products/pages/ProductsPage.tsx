import { Package } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/states'
import { Label } from '@/components/ui/label'
import { MerchantPicker } from '@/features/merchants/components/MerchantPicker'
import { ProductsPanel } from '../components/ProductsPanel'

/** Products belong to a store, so the admin picks the store first (kept in the URL). */
export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const merchantId = searchParams.get('merchantId')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Product grids of each store; Buy now opens the affiliate link."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label htmlFor="products-merchant">Merchant</Label>
        <MerchantPicker
          id="products-merchant"
          value={merchantId}
          onChange={(id) => setSearchParams(id ? { merchantId: id } : {}, { replace: true })}
        />
      </div>
      {merchantId ? (
        <ProductsPanel key={merchantId} merchantId={merchantId} />
      ) : (
        <EmptyState
          icon={Package}
          title="Choose a merchant"
          description="Select a store to see and manage its products."
        />
      )}
    </div>
  )
}
