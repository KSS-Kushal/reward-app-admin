import { ShieldX } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '../context/auth-context'

export function UnauthorizedPage() {
  const { status, rejectedEmail } = useAuth()
  const signedIn = status === 'authenticated'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="size-8 text-destructive" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">403</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          You don't have permission to access this page.
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {rejectedEmail ? (
            <>
              <span className="font-medium text-foreground">{rejectedEmail}</span> is not an admin account.
              Ask an existing admin to grant you the admin role, or sign in with a different account.
            </>
          ) : (
            'This area is restricted to Kavodnik administrators.'
          )}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {signedIn ? (
          <Button asChild>
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Sign in with another account</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
