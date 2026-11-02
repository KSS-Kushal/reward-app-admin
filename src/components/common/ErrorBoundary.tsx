import { AlertOctagon, RefreshCw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/** Catches render errors so a crashing page shows a recovery screen instead of a blank one. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return <CrashScreen onRetry={() => this.setState({ error: null })} />
  }
}

export function CrashScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertOctagon className="size-7 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong.</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This page hit an unexpected error. Try again, or reload the app if the problem continues.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry ?? (() => window.location.reload())}>
          <RefreshCw /> Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.assign('/admin')}>
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
