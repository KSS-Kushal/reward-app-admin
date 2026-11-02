import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/use-api-mutation'
import type { FaqRequest } from '../types/faq.types'
import { faqApi } from './faq.api'

export const faqsKeys = { all: ['faqs'] as const }

export function useFaqs() {
  return useQuery({ queryKey: faqsKeys.all, queryFn: ({ signal }) => faqApi.list(signal) })
}

export function useCreateFaq() {
  return useApiMutation({
    mutationFn: (body: FaqRequest) => faqApi.create(body),
    successMessage: 'FAQ created successfully.',
    invalidate: [faqsKeys.all],
  })
}

export function useUpdateFaq() {
  return useApiMutation({
    mutationFn: ({ id, body }: { id: string; body: FaqRequest }) => faqApi.update(id, body),
    successMessage: 'FAQ updated successfully.',
    invalidate: [faqsKeys.all],
  })
}

export function useDeleteFaq() {
  return useApiMutation({
    mutationFn: (id: string) => faqApi.remove(id),
    successMessage: 'FAQ deleted successfully.',
    invalidate: [faqsKeys.all],
  })
}
