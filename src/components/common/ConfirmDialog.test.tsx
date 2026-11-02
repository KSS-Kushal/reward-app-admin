import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function Harness({ onConfirm }: { onConfirm: () => Promise<unknown> }) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete merchant?"
      description="This will also delete its offers and products."
      confirmLabel="Delete merchant"
      destructive
      onConfirm={onConfirm}
    />
  )
}

describe('ConfirmDialog', () => {
  it('closes after a successful confirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(null)
    render(<Harness onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete merchant' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('stays open when the action fails so it can be retried', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('nope'))
    render(<Harness onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete merchant' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'This will also delete its offers and products.',
    )
  })

  it('cancel never runs the action', async () => {
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
