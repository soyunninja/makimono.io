import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AdaptiveAddFlow } from '@/features/items/add-flow'
import { createMockInterestRepository } from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('AdaptiveAddFlow', () => {
  it('switches the category-specific fields when the selected category changes on desktop', async () => {
    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    expect(screen.getByText('Desktop dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Series' }))

    expect(await screen.findByLabelText('Current season')).toBeInTheDocument()
    expect(screen.getByLabelText('Where to watch next')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Author')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Reading format')).toBeInTheDocument()
    expect(screen.queryByLabelText('Current season')).not.toBeInTheDocument()
  })

  it('uses the mobile sheet presentation and creates a mock item with category-specific notes', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()

    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    expect(screen.getByText('Mobile sheet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Websites' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Cursor rules reference' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'docs, workflow' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Keep this handy for future setup.' } })
    fireEvent.change(screen.getByLabelText('Link'), { target: { value: 'https://example.com/rules' } })
    fireEvent.change(screen.getByLabelText('Why it stands out'), { target: { value: 'Great MCP onboarding summary.' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    const items = await repository.listItems()

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      category: 'webs',
      title: 'Cursor rules reference',
      tags: ['docs', 'workflow'],
    })
    expect(items[0].notes).toContain('Keep this handy for future setup.')
    expect(items[0].notes).toContain('Link: https://example.com/rules')
    expect(items[0].notes).toContain('Why it stands out: Great MCP onboarding summary.')
  })

  it('keeps adaptive add controls fixed-height and wrap-friendly for touch use', async () => {
    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    const seriesOption = screen.getByRole('radio', { name: 'Series' })
    const titleInput = screen.getByLabelText('Title')
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const submitButton = screen.getByRole('button', { name: 'Add interest' })

    expect(seriesOption).toHaveClass('h-11')
    expect(titleInput).toHaveClass('h-11')
    expect(cancelButton).toHaveClass('h-11')
    expect(submitButton).toHaveClass('h-11')
    expect(submitButton.parentElement).toHaveClass('flex-col-reverse', 'sm:flex-row', 'sm:justify-end')
  })
})
