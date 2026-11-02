import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { authValue, renderWithProviders, testAdmin } from '@/test/render'
import { AdminRoute, ProtectedRoute } from './guards'

const page = (
  <ProtectedRoute>
    <AdminRoute>
      <p>Admin content</p>
    </AdminRoute>
  </ProtectedRoute>
)
const destinations = [
  { path: '/login', element: <p>Login page</p> },
  { path: '/unauthorized', element: <p>Unauthorized page</p> },
]

describe('route guards', () => {
  it('shows the admin app to an authenticated admin', () => {
    renderWithProviders(page, { path: '/admin', route: '/admin', extraRoutes: destinations })
    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('sends signed-out visitors to login and remembers where they were going', () => {
    const { router } = renderWithProviders(page, {
      path: '/admin/*',
      route: '/admin/payouts?status=failed',
      auth: authValue({ status: 'signed-out', admin: null }),
      extraRoutes: destinations,
    })
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/admin/payouts?status=failed' })
  })

  it('sends non-admins to the unauthorized page', () => {
    renderWithProviders(page, {
      path: '/admin',
      route: '/admin',
      auth: authValue({ status: 'forbidden', admin: null }),
      extraRoutes: destinations,
    })
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })

  it('never renders admin content for a USER role, even with a session', () => {
    renderWithProviders(page, {
      path: '/admin',
      route: '/admin',
      auth: authValue({ admin: { ...testAdmin, role: 'USER' } }),
      extraRoutes: destinations,
    })
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })

  it('shows a loader while the session is being verified', () => {
    renderWithProviders(page, {
      path: '/admin',
      route: '/admin',
      auth: authValue({ status: 'initializing', admin: null }),
    })
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session')
  })
})
