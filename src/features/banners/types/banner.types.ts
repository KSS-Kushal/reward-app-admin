export interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  tag: string | null
  actionRoute: string | null
  actionUrl: string | null
  /** Exactly two `#RRGGBB` colours, or null. */
  gradient: [string, string] | null
  priority: number
  startsAt: string | null
  endsAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

/** `POST`/`PUT /admin/banners` body. `id` is only honoured on create. */
export interface BannerRequest {
  id?: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  tag: string | null
  actionRoute: string | null
  actionUrl: string | null
  gradient: [string, string] | null
  priority: number
  startsAt: string | null
  endsAt: string | null
  active: boolean
}
