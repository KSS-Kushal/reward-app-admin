import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth-context'
import type { AdminUser } from '@/features/users/types/user.types'

export const testAdmin: AdminUser = {
  id: 'admin-1',
  name: 'Asha Admin',
  email: 'asha@kavodnik.app',
  avatarUrl: null,
  phone: null,
  referralCode: 'ASHA1',
  status: 'ACTIVE',
  role: 'ADMIN',
  joinedAt: '2026-01-01T00:00:00Z',
  lastLoginAt: '2026-10-20T00:00:00Z',
}

export function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    admin: testAdmin,
    rejectedEmail: null,
    signInWithGoogle: async () => undefined,
    signOut: async () => undefined,
    retry: () => undefined,
    ...overrides,
  }
}

/** Renders inside a data router (needed by useBlocker), React Query and a fake auth session. */
export function renderWithProviders(
  ui: ReactElement,
  {
    path = '/',
    route = '/',
    auth = authValue(),
    extraRoutes = [],
  }: {
    path?: string
    route?: string
    auth?: AuthContextValue
    extraRoutes?: { path: string; element: ReactElement }[]
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path, element: ui }, ...extraRoutes], { initialEntries: [route] })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}
