/** Entity types the backend records in the audit log, with a label and (when one exists) an admin page. */
export const AUDIT_ENTITY_TYPES: { value: string; label: string; link?: (id: string) => string | null }[] = [
  { value: 'user', label: 'User', link: (id) => `/admin/users/${id}` },
  { value: 'banner', label: 'Banner', link: (id) => `/admin/banners/${id}/edit` },
  { value: 'earn_option', label: 'Earn option', link: () => '/admin/earn-options' },
  { value: 'article', label: 'Article', link: (id) => `/admin/articles/${id}/edit` },
  { value: 'article_category', label: 'Article category', link: () => '/admin/article-categories' },
  { value: 'quiz_question', label: 'Quiz question', link: (id) => `/admin/quiz-questions/${id}/edit` },
  { value: 'merchant_category', label: 'Merchant category', link: () => '/admin/merchant-categories' },
  { value: 'merchant', label: 'Merchant', link: (id) => `/admin/merchants/${id}` },
  { value: 'offer', label: 'Offer' },
  { value: 'product', label: 'Product', link: (id) => `/admin/products/${id}/edit` },
  { value: 'cashback_order', label: 'Cashback order' },
  { value: 'payout', label: 'Payout', link: () => '/admin/payouts?status=all' },
  { value: 'redeem_option', label: 'Redeem option', link: () => '/admin/redeem-options' },
  { value: 'faq', label: 'FAQ', link: () => '/admin/faqs' },
  { value: 'config', label: 'Configuration', link: () => '/admin/config' },
  { value: 'media', label: 'Media', link: () => '/admin/media' },
  { value: 'ad_settings', label: 'Ad settings', link: () => '/admin/ads/history' },
  { value: 'reward_claim', label: 'Reward claim', link: () => '/admin/ads/reward-claims?status=completed' },
]

export const entityLabel = (type: string) =>
  AUDIT_ENTITY_TYPES.find((item) => item.value === type)?.label ?? type

/** Deleted entities have no page to open. */
export function entityLink(type: string, id: string, action: string): string | null {
  if (action === 'DELETE') return null
  return AUDIT_ENTITY_TYPES.find((item) => item.value === type)?.link?.(id) ?? null
}
