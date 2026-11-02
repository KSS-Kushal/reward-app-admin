import { createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router'

/** Route handle: static breadcrumb data declared next to each route. */
export interface RouteHandle {
  crumb?: string
  /** Sidebar section shown as the first (unlinked) crumb, e.g. "Content". */
  section?: string
}

interface BreadcrumbContextValue {
  labels: Record<string, string>
  setLabel: (pathname: string, label: string | null) => void
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  setLabel: () => undefined,
})

/**
 * Replaces a crumb with a dynamic label, e.g. the article title. Targets the current page by default;
 * pass `path` to label a parent crumb (e.g. the merchant on its nested product pages).
 */
export function useBreadcrumbLabel(label: string | null | undefined, path?: string) {
  const { setLabel } = useContext(BreadcrumbContext)
  const { pathname } = useLocation()
  const target = path ?? pathname
  useEffect(() => {
    if (!label) return
    setLabel(target, label)
    return () => setLabel(target, null)
  }, [label, target, setLabel])
}
