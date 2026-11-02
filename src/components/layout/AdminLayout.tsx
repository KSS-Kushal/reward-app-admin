import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { LoadingState } from '@/components/common/states'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { BreadcrumbProvider, Breadcrumbs } from './Breadcrumbs'
import { ThemeToggle } from './ThemeToggle'

export function AdminLayout() {
  const { pathname } = useLocation()
  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumbs />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 outline-none md:px-6">
            <div className="mx-auto w-full max-w-7xl">
              {/* Reset the boundary on navigation so one broken page doesn't block the others. */}
              <ErrorBoundary key={pathname}>
                <Suspense fallback={<LoadingState label="Loading page…" />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}
