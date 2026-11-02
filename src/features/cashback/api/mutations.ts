import { useApiMutation } from '@/hooks/use-api-mutation'
import { cashbackApi, type CashbackOrderRequest, type CashbackRef } from './cashback.api'

// Cashback credits show up in user wallets.
const invalidate = [['users']]

export function useRecordCashback() {
  return useApiMutation({
    mutationFn: (body: CashbackOrderRequest) => cashbackApi.record(body),
    successMessage: 'Cashback recorded as pending.',
    invalidate,
  })
}

export function useConfirmCashback() {
  return useApiMutation({
    mutationFn: (ref: CashbackRef) => cashbackApi.confirm(ref),
    successMessage: 'Cashback confirmed. The coins are now available to the user.',
    invalidate,
  })
}

export function useCancelCashback() {
  return useApiMutation({
    mutationFn: (ref: CashbackRef) => cashbackApi.cancel(ref),
    successMessage: 'Cashback cancelled. The pending credit was marked as failed.',
    invalidate,
  })
}
