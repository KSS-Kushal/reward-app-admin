/**
 * Signals from the HTTP layer to the AuthProvider, which lives in React. Keeps the Axios interceptors
 * free of React and navigation concerns.
 */
export type AuthEvent =
  /** The refresh token was rejected: the session is over. */
  | 'session-expired'
  /** An admin endpoint returned 403: the signed-in user may have lost the ADMIN role. */
  | 'forbidden'

type Handler = (event: AuthEvent) => void

const handlers = new Set<Handler>()

export const authEvents = {
  emit(event: AuthEvent) {
    handlers.forEach((handler) => handler(event))
  },
  on(handler: Handler): () => void {
    handlers.add(handler)
    return () => handlers.delete(handler)
  },
}
