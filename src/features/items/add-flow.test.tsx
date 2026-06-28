import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdaptiveAddFlow, AdaptiveEditFlow } from '@/features/items/add-flow'
import { createMockInterestRepository, getAppInterestRepository, resetAppInterestRepository } from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'

beforeEach(() => {
  installMockLocalStorage()
  window.localStorage.clear()
  resetAppInterestRepository()
})

afterEach(() => {
  window.localStorage.clear()
  resetAppInterestRepository()
})

describe('AdaptiveAddFlow', () => {
  it('keeps only the common fields visible when the selected category changes on desktop', async () => {
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
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Tags')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.queryByText('Category details')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Current season')).not.toBeInTheDocument()

    const booksOption = screen.getByRole('radio', { name: 'Books' })

    fireEvent.click(booksOption)

    await waitFor(() => {
      expect(booksOption).toHaveAttribute('aria-checked', 'true')
    })

    expect(screen.queryByLabelText('Author')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reading format')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Current season')).not.toBeInTheDocument()
  })

  it('uses the mobile sheet presentation and creates a mock item with common notes and tags', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()

    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Music' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Nujabes — Modal Soul' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'spotify, chillhop' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Keep this handy for the next focus block.' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    const items = await repository.listItems()

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      category: 'music',
      title: 'Nujabes — Modal Soul',
      tags: ['spotify', 'chillhop'],
    })
    expect(items[0].notes).toBe('Keep this handy for the next focus block.')
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

  it('persists created items across app repository recreation', async () => {
    const onCreated = vi.fn()

    resetAppInterestRepository([])

    render(
      <LocaleProvider>
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Clean Architecture' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'architecture, boundaries' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    resetAppInterestRepository([])

    const recreatedItems = await getAppInterestRepository([]).listItems()

    expect(recreatedItems).toHaveLength(1)
    expect(recreatedItems[0]).toMatchObject({
      category: 'books',
      tags: ['architecture', 'boundaries'],
      title: 'Clean Architecture',
    })
  })

  it('shows icon-only save and delete actions in the edit flow footer without a cancel button', async () => {
    render(
      <LocaleProvider>
        <AdaptiveEditFlow isDesktop itemId="movie-arrival" repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit interest' })).toBeInTheDocument()

    const deleteButton = screen.getByRole('button', { name: 'Delete interest' })
    const saveButton = screen.getByRole('button', { name: 'Save changes' })

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(deleteButton).toBeEnabled()
    expect(saveButton).toBeEnabled()
    expect(deleteButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
