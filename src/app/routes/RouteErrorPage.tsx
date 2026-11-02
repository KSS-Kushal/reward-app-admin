import { isRouteErrorResponse, useRouteError } from 'react-router'
import { CrashScreen } from '@/components/common/ErrorBoundary'
import { NotFoundPage } from './NotFoundPage'

/** Router-level error element: unknown URLs and errors thrown while loading a route chunk. */
export function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  console.error('Route error', error)
  return <CrashScreen />
}
