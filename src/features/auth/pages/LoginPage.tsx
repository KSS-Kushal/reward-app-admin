import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useTheme } from 'next-themes'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage, toApiError } from '@/lib/api/errors'
import { env } from '@/lib/env'
import { useAuth } from '../context/auth-context'

function signInErrorMessage(error: unknown): string {
  const apiError = toApiError(error)
  if (apiError.code === 'ACCOUNT_BANNED') return 'This account has been suspended.'
  if (apiError.code === 'INVALID_GOOGLE_TOKEN') return 'Google sign-in failed. Please try again.'
  return getErrorMessage(error, 'Unable to sign in. Please try again.')
}

export function LoginPage() {
  const { status, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { resolvedTheme } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  if (status === 'authenticated') return <Navigate to={from} replace />

  const handleCredential = async (credential: string | undefined) => {
    if (!credential) {
      setError('Google did not return a credential. Please try again.')
      return
    }
    setPending(true)
    setError(null)
    try {
      await signInWithGoogle(credential)
      // The provider decides between dashboard and unauthorized; route guards take it from there.
      navigate(from, { replace: true })
    } catch (signInError) {
      setError(signInErrorMessage(signInError))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent"
      />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            K
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Kavodnik Admin</CardTitle>
            <CardDescription>Manage your rewards platform</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {env.GOOGLE_CLIENT_ID ? (
            <div className="flex min-h-11 justify-center">
              {pending ? (
                <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Signing you in…
                </p>
              ) : (
                <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={(response) => void handleCredential(response.credential)}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    text="continue_with"
                    shape="rectangular"
                    size="large"
                    width="300"
                    theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
                  />
                </GoogleOAuthProvider>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle />
              <AlertTitle>Google sign-in isn't configured</AlertTitle>
              <AlertDescription>
                Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> to the Google OAuth web client id
                that the backend accepts, then restart the app.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden /> Only accounts with the admin role can sign in.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
