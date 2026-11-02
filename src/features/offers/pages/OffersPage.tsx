import { BadgePercent } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/states'
import { Label } from '@/components/ui/label'
import { MerchantPicker } from '@/features/merchants/components/MerchantPicker'
import { useMerchant } from '@/features/merchants/api/queries'
import { OffersPanel } from '../components/OffersPanel'

/** Offers belong to a store, so the admin picks the store first (kept in the URL). */
export function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const merchantId = searchParams.get('merchantId')
  const merchant = useMerchant(merchantId ?? undefined)

  return (
    <div className="space-y-6">
      <PageHeader title="Offers" description="Coupons and deals for each store in Shop & Earn." />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label htmlFor="offers-merchant">Merchant</Label>
        <MerchantPicker
          id="offers-merchant"
          value={merchantId}
          onChange={(id) => setSearchParams(id ? { merchantId: id } : {}, { replace: true })}
        />
      </div>
      {merchantId ? (
        <OffersPanel key={merchantId} merchantId={merchantId} merchantName={merchant.data?.name} />
      ) : (
        <EmptyState
          icon={BadgePercent}
          title="Choose a merchant"
          description="Select a store to see and manage its offers."
        />
      )}
    </div>
  )
}
