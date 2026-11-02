import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useDeleteMerchant } from '../api/mutations'
import type { Merchant } from '../types/merchant.types'

export function DeleteMerchantDialog({
  merchant,
  onClose,
  onDeleted,
}: {
  merchant: Merchant | null
  onClose: () => void
  onDeleted?: () => void
}) {
  const remove = useDeleteMerchant()
  return (
    <ConfirmDialog
      open={merchant !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${merchant?.name ?? 'merchant'}?`}
      description={
        <>
          <p className="font-medium text-foreground">This will also delete its offers and products.</p>
          <p>This action cannot be undone.</p>
        </>
      }
      confirmLabel="Delete merchant"
      destructive
      pending={remove.isPending}
      onConfirm={async () => {
        if (!merchant) return
        await remove.mutateAsync(merchant.id)
        onDeleted?.()
      }}
    />
  )
}
