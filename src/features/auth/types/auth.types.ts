/** User object returned by `POST /auth/google` (the app's user view; it carries no role). */
export interface SignedInUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  phone: string | null
  referralCode: string
  joinedAt: string
}

export interface SignInResponse {
  accessToken: string
  refreshToken: string
  user: SignedInUser
}
