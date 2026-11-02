import { Fragment, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Link, useMatches } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BreadcrumbContext, type RouteHandle } from './breadcrumb-context'

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({})
  const setLabel = useCallback((pathname: string, label: string | null) => {
    setLabels((current) => {
      if (label === null) {
        if (!(pathname in current)) return current
        const next = { ...current }
        delete next[pathname]
        return next
      }
      return current[pathname] === label ? current : { ...current, [pathname]: label }
    })
  }, [])
  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel])
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function Breadcrumbs() {
  const matches = useMatches()
  const { labels } = useContext(BreadcrumbContext)

  const section = matches.map((match) => (match.handle as RouteHandle | undefined)?.section).findLast(Boolean)
  const crumbs = matches
    .filter((match) => (match.handle as RouteHandle | undefined)?.crumb)
    .map((match) => ({
      pathname: match.pathname,
      label: labels[match.pathname] ?? (match.handle as RouteHandle).crumb!,
    }))
    // Index routes repeat their parent's path; keep the last label per path.
    .filter((crumb, index, all) => all.findLastIndex((other) => other.pathname === crumb.pathname) === index)

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {section && (
          <>
            <BreadcrumbItem className="hidden md:inline-flex">{section}</BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <Fragment key={crumb.pathname}>
              <BreadcrumbItem className={last ? 'min-w-0' : 'hidden md:inline-flex'}>
                {last ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
