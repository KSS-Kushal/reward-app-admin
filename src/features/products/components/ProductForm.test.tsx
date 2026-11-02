import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderWithProviders } from '@/test/render'
import { ProductForm } from './ProductForm'

describe('ProductForm', () => {
  it('validates before submitting and shows prices rules', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithProviders(<ProductForm onSubmit={onSubmit} onCancel={() => undefined} pending={false} />)

    await user.click(screen.getByRole('button', { name: 'Create product' }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Price is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid product and flags links without {subId}', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<ProductForm onSubmit={onSubmit} onCancel={() => undefined} pending={false} />)

    await user.type(screen.getByLabelText(/^Name/), 'boAt Rockerz 450')
    await user.type(screen.getByLabelText(/^Affiliate link/), 'https://www.amazon.in/dp/B07PR1CL3S')
    expect(screen.getByText(/orders can't be matched to users/)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Price/), '1299')
    await user.type(screen.getByLabelText(/Original price/), '3990')
    await user.click(screen.getByRole('button', { name: 'Create product' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      name: 'boAt Rockerz 450',
      price: 1299,
      originalPrice: 3990,
    })
  })

  it('shows backend field errors on the matching field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'x',
        fieldErrors: { affiliateUrl: 'Affiliate link is blocked.' },
      }),
    )
    renderWithProviders(<ProductForm onSubmit={onSubmit} onCancel={() => undefined} pending={false} />)
    await user.type(screen.getByLabelText(/^Name/), 'X')
    await user.type(screen.getByLabelText(/^Affiliate link/), 'https://a.in/x?s={{subId}')
    await user.type(screen.getByLabelText(/^Price/), '10')
    await user.click(screen.getByRole('button', { name: 'Create product' }))
    expect(await screen.findByText('Affiliate link is blocked.')).toBeInTheDocument()
  })
})
