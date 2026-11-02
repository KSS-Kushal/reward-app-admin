import { CloudOff, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '../context/auth-context'

function FullScreenLoader() {
  return (
    <div
      role="status"
      className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden /> Checking your session…
    </div>
  )
}

function Unreachable({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  return (
    <div role="alert" className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <CloudOff className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Unable to reach the Kavodnik API</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The server didn't respond while verifying your session. Check that the backend is running and try
          again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry}>Try again</Button>
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

/** Requires a verified session; sends signed-out visitors to /login and remembers where they were going. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, retry, signOut } = useAuth()
  const location = useLocation()

  if (status === 'initializing') return <FullScreenLoader />
  if (status === 'unreachable') return <Unreachable onRetry={retry} onSignOut={() => void signOut()} />
  if (status === 'forbidden') return <Navigate to="/unauthorized" replace />
  if (status === 'signed-out') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }
  return <>{children}</>
}

/**
 * Requires the ADMIN role. UX only: the backend rejects non-admins on every /admin endpoint regardless.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { admin } = useAuth()
  if (admin?.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
