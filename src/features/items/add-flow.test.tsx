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
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()
    expect(screen.queryByText('Choose a category and save the basics.')).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a category for this item.')).not.toBeInTheDocument()

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

  it('uses the mobile sheet presentation and creates a mock item from trimmed Enter/comma tags without duplicate chips', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Music' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Nujabes — Modal Soul' } })

    const tagsInput = screen.getByLabelText('Tags')

    fireEvent.change(tagsInput, { target: { value: '  spotify  ' } })
    fireEvent.keyDown(tagsInput, { code: 'Comma', key: ',' })

    expect(screen.getByText('spotify')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Remove tag: spotify' })).toBeVisible()

    fireEvent.change(tagsInput, { target: { value: 'SPOTIFY' } })
    fireEvent.keyDown(tagsInput, { code: 'Enter', key: 'Enter' })

    expect(screen.getAllByRole('button', { name: 'Remove tag: spotify' })).toHaveLength(1)

    fireEvent.change(tagsInput, { target: { value: ' chillhop ' } })
    fireEvent.keyDown(tagsInput, { code: 'Enter', key: 'Enter' })

    expect(screen.getByText('chillhop')).toBeVisible()
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
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    const seriesOption = screen.getByRole('radio', { name: 'Series' })
    const titleInput = screen.getByLabelText('Title')
    const submitButton = screen.getByRole('button', { name: 'Add interest' })

    expect(seriesOption).toBeEnabled()
    expect(titleInput).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    fireEvent.click(seriesOption)
    fireEvent.change(titleInput, { target: { value: 'A Short Hike' } })

    expect(submitButton).toBeEnabled()
  })

  it('persists created items across app repository recreation', async () => {
    const onCreated = vi.fn()

    resetAppInterestRepository([])

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Clean Architecture' } })

    const tagsInput = screen.getByLabelText('Tags')

    fireEvent.change(tagsInput, { target: { value: 'architecture' } })
    fireEvent.keyDown(tagsInput, { code: 'Comma', key: ',' })
    fireEvent.change(tagsInput, { target: { value: 'boundaries' } })
    fireEvent.keyDown(tagsInput, { code: 'Enter', key: 'Enter' })

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

  it('uses an icon-only submit button with an accessible name and no visible submit text', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    const submitButton = screen.getByRole('button', { name: 'Add interest' })

    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toHaveTextContent('Add interest')
  })

  it('renders plain edit detail fields without the Detalles card heading while keeping labels and icon footer actions', async () => {
    render(
      <LocaleProvider initialLocale="es">
        <AdaptiveEditFlow isDesktop itemId="movie-arrival" repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const categoryBadge = await screen.findByText('Películas')
    const titleInput = screen.getByLabelText('Título')
    const tagsInput = screen.getByLabelText('Etiquetas')
    const notesInput = screen.getByLabelText('Notas')

    const deleteButton = screen.getByRole('button', { name: 'Eliminar interés' })
    const saveButton = screen.getByRole('button', { name: 'Guardar cambios' })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Editar interés' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Actualiza los detalles guardados y mantén el elemento en tu dashboard.')).not.toBeInTheDocument()
    expect(screen.queryByText('Detalles')).not.toBeInTheDocument()
    expect(titleInput.closest('[class*="bg-background/40"]')).toBeNull()
    expect(titleInput).toBeVisible()
    expect(tagsInput).toBeVisible()
    expect(notesInput).toBeVisible()
    expect(categoryBadge).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(deleteButton).toBeEnabled()
    expect(saveButton).toBeEnabled()
    expect(deleteButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('lets users remove existing edit tags and saves the updated string array', async () => {
    const repository = createMockInterestRepository()
    const onUpdated = vi.fn()

    render(
      <LocaleProvider initialLocale="es">
        <AdaptiveEditFlow isDesktop itemId="movie-arrival" onUpdated={onUpdated} repository={repository} />
      </LocaleProvider>,
    )

    const tagsInput = await screen.findByLabelText('Etiquetas')

    expect(screen.getByText('drama')).toBeVisible()
    expect(screen.getByText('language')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar etiqueta: drama' }))

    await waitFor(() => {
      expect(screen.queryByText('drama')).not.toBeInTheDocument()
    })

    fireEvent.keyDown(tagsInput, { code: 'Backspace', key: 'Backspace' })

    await waitFor(() => {
      expect(screen.queryByText('language')).not.toBeInTheDocument()
    })

    fireEvent.change(tagsInput, { target: { value: '  ciencia ficción  ' } })
    fireEvent.keyDown(tagsInput, { code: 'Enter', key: 'Enter' })

    expect(screen.getByText('ciencia ficción')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1)
    })

    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['ciencia ficción'],
      }),
    )
  })
})
