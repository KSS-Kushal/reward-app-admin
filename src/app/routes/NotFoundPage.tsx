import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Compass className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page Not Found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Button asChild>
        <Link to="/admin">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
