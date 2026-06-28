import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()

    const seriesOption = screen.getByRole('radio', { name: 'Series' })

    expect(seriesOption).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(seriesOption)

    expect(seriesOption).toHaveAttribute('aria-checked', 'true')
    expect(await screen.findByLabelText('Current season')).toBeInTheDocument()
    expect(screen.getByLabelText('Where to watch next')).toBeInTheDocument()
    const seriesDetailsCard = screen.getByText('Category details').closest('[data-slot="card"]')

    expect(seriesDetailsCard).not.toBeNull()
    expect(within(seriesDetailsCard as HTMLElement).getByText('Series')).toBeInTheDocument()

    const booksOption = screen.getByRole('radio', { name: 'Books' })

    fireEvent.click(booksOption)

    await waitFor(() => {
      expect(screen.getByLabelText('Author')).toBeInTheDocument()
    })

    expect(booksOption).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Reading format')).toBeInTheDocument()
    expect(screen.queryByLabelText('Current season')).not.toBeInTheDocument()

    const booksDetailsCard = screen.getByText('Category details').closest('[data-slot="card"]')

    expect(booksDetailsCard).not.toBeNull()
    expect(within(booksDetailsCard as HTMLElement).getByText('Books')).toBeInTheDocument()
  })

  it('uses the mobile sheet presentation and creates a mock item with category-specific notes', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()

    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()

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

  it('keeps adaptive add controls accessible and only enables submit when required fields are ready', async () => {
    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    const seriesOption = screen.getByRole('radio', { name: 'Series' })
    const titleInput = screen.getByLabelText('Title')
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const submitButton = screen.getByRole('button', { name: 'Add interest' })

    expect(seriesOption).toBeEnabled()
    expect(titleInput).toBeEnabled()
    expect(cancelButton).toBeEnabled()
    expect(submitButton).toBeDisabled()

    fireEvent.click(seriesOption)
    fireEvent.change(titleInput, { target: { value: 'A Short Hike' } })

    expect(submitButton).toBeEnabled()
  })
})
