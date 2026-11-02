export interface Faq {
  id: string
  question: string
  answer: string
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface FaqRequest {
  id?: string
  question: string
  answer: string
  sortOrder: number
  active: boolean
}
