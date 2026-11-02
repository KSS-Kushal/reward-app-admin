import { api } from '@/lib/api/client'
import type { Faq, FaqRequest } from '../types/faq.types'

const path = (id: string) => `/admin/faqs/${encodeURIComponent(id)}`

export const faqApi = {
  list: (signal?: AbortSignal) => api.get<Faq[]>('/admin/faqs', undefined, { signal }),
  create: (body: FaqRequest) => api.post<Faq>('/admin/faqs', body),
  update: (id: string, body: FaqRequest) => api.put<Faq>(path(id), body),
  remove: (id: string) => api.delete(path(id)),
}
