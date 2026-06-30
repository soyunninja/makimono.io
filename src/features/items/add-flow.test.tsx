import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdaptiveAddFlow, AdaptiveEditFlow } from '@/features/items/add-flow'
import type { InterestCoverResolver } from '@/features/items/cover-metadata'
import { createMockInterestRepository, getAppInterestRepository, resetAppInterestRepository } from '@/features/items/mock-repository'
import type { InterestItemCoverMetadata } from '@/features/items/types'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'

function hasExactText(text: string) {
  return (_content: string, element: Element | null) => element?.textContent === text
}

beforeEach(() => {
  installMockLocalStorage()
  window.localStorage.clear()
  resetAppInterestRepository()
})

afterEach(() => {
  vi.useRealTimers()
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

    expect(screen.getByRole('heading', { level: 1, name: 'Add' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Add' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a category and save the basics.')).not.toBeInTheDocument()
    expect(screen.queryByText('Category details')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a category for this item.')).not.toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Category' })).toBeInTheDocument()

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

  it('aligns the add drawer title inside the same centered content column as the form', () => {
    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    const title = screen.getByRole('heading', { level: 1, name: 'Add' })
    const header = title.closest('[data-slot="drawer-header"]')
    const contentColumn = header?.parentElement
    const scrollContainer = contentColumn?.parentElement
    const form = screen.getByLabelText('Title').closest('form')
    const footer = screen.getByRole('button', { name: 'Add interest' }).closest('[data-slot="drawer-footer"]')

    expect(scrollContainer).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto')
    expect(scrollContainer).not.toHaveClass('max-h-[85vh]')
    expect(contentColumn).toHaveClass('mx-auto', 'w-full', 'max-w-[1200px]')
    expect(form?.parentElement).toBe(contentColumn)
    expect(footer).toHaveClass('shrink-0', 'border-t')
    expect(footer).not.toBe(scrollContainer)
    expect(footer?.parentElement).toBe(document.querySelector('[data-slot="drawer-content"]'))
  })

  it('shows Podcasts in the selector and saves podcast items from trimmed Enter/comma tags without duplicate chips', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Add' })).toBeInTheDocument()

    const podcastOption = screen.getByRole('radio', { name: 'Podcasts' })

    expect(podcastOption).toBeInTheDocument()

    fireEvent.click(podcastOption)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Syntax — Taming Complexity' } })

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
      category: 'podcasts',
      title: 'Syntax — Taming Complexity',
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

  it('shows a cover preview after an explicit search and stores the selected metadata on create', async () => {
    const repository = createMockInterestRepository([])
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/severance.jpg',
      coverMatchedTitle: 'Severance',
      coverProvider: 'tmdb',
    })

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Series' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Severance' } })

    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    expect(await screen.findByRole('img', { name: 'Cover preview' })).toHaveAttribute('src', 'https://images.example.com/severance.jpg')
    expect(screen.getByText(hasExactText('Matched title: Severance'))).toBeVisible()
    expect(screen.getByText(hasExactText('Provider: TMDB'))).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(async () => {
      const items = await repository.listItems()

      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        coverImageUrl: 'https://images.example.com/severance.jpg',
        coverMatchedTitle: 'Severance',
        coverProvider: 'tmdb',
      })
    })

    expect(coverResolver).toHaveBeenCalledWith(expect.objectContaining({
      category: 'series',
      title: 'Severance',
    }))
  })

  it('automatically looks up a cover after category and title settle without duplicating the same lookup', async () => {
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/severance.jpg',
      coverMatchedTitle: 'Severance',
      coverProvider: 'tmdb',
    })

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Series' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Sev' } })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Severance' } })

    await new Promise((resolve) => window.setTimeout(resolve, 250))

    expect(coverResolver).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(coverResolver).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByRole('img', { name: 'Cover preview' })).toHaveAttribute('src', 'https://images.example.com/severance.jpg')
    expect(coverResolver).toHaveBeenCalledTimes(1)
    expect(coverResolver).toHaveBeenCalledWith(expect.objectContaining({
      category: 'series',
      title: 'Severance',
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    expect(coverResolver).toHaveBeenCalledTimes(1)
  })

  it('ignores stale automatic cover results after the title changes', async () => {
    const pendingLookups: Array<(value: InterestItemCoverMetadata | null) => void> = []
    const coverResolver: InterestCoverResolver = vi.fn((_input) => new Promise<InterestItemCoverMetadata | null>((resolve) => {
      pendingLookups.push(resolve)
    }))

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Series' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Old title' } })

    await waitFor(() => {
      expect(coverResolver).toHaveBeenCalledTimes(1)
    })

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Severance' } })

    await waitFor(() => {
      expect(coverResolver).toHaveBeenCalledTimes(2)
    })

    await act(async () => {
      pendingLookups[0]?.({
        coverImageUrl: 'https://images.example.com/old.jpg',
        coverMatchedTitle: 'Old title',
        coverProvider: 'tmdb',
      })
    })

    expect(screen.queryByRole('img', { name: 'Cover preview' })).not.toBeInTheDocument()

    await act(async () => {
      pendingLookups[1]?.({
        coverImageUrl: 'https://images.example.com/severance.jpg',
        coverMatchedTitle: 'Severance',
        coverProvider: 'tmdb',
      })
    })

    expect(await screen.findByRole('img', { name: 'Cover preview' })).toHaveAttribute('src', 'https://images.example.com/severance.jpg')
    expect(screen.getByText(hasExactText('Matched title: Severance'))).toBeVisible()
    expect(screen.queryByText(hasExactText('Matched title: Old title'))).not.toBeInTheDocument()
  })

  it('removes a found cover preview before submit and saves the item without cover metadata', async () => {
    const repository = createMockInterestRepository([])
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/severance.jpg',
      coverMatchedTitle: 'Severance',
      coverProvider: 'tmdb',
    })

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Series' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Severance' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    await screen.findByRole('img', { name: 'Cover preview' })

    fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }))

    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Cover preview' })).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(async () => {
      const [createdItem] = await repository.listItems()

      expect(createdItem).toMatchObject({
        category: 'series',
        title: 'Severance',
      })
      expect(createdItem.coverImageUrl).toBeUndefined()
      expect(createdItem.coverMatchedTitle).toBeUndefined()
      expect(createdItem.coverProvider).toBeUndefined()
    })
  })

  it('maps podcast cover lookups to the music resolver path while saving the item as podcasts', async () => {
    const repository = createMockInterestRepository([])
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/syntax.jpg',
      coverMatchedTitle: 'Syntax',
      coverProvider: 'cover-art-archive',
    })

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Podcasts' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Syntax' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    await screen.findByRole('img', { name: 'Cover preview' })
    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(async () => {
      const items = await repository.listItems()

      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        category: 'podcasts',
        coverImageUrl: 'https://images.example.com/syntax.jpg',
        coverMatchedTitle: 'Syntax',
        coverProvider: 'cover-art-archive',
      })
    })

    expect(coverResolver).toHaveBeenCalledWith(expect.objectContaining({
      category: 'music',
      title: 'Syntax',
    }))
  })

  it('still creates the item without cover metadata when automatic cover lookup finds nothing', async () => {
    const repository = createMockInterestRepository([])
    const onCreated = vi.fn()
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue(null)

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveAddFlow coverResolver={coverResolver} isDesktop={false} onCreated={onCreated} repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Clean Code' } })

    await waitFor(() => {
      expect(coverResolver).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1)
    })

    const [createdItem] = await repository.listItems()

    expect(createdItem).toMatchObject({
      category: 'books',
      title: 'Clean Code',
    })
    expect(createdItem.coverImageUrl).toBeUndefined()
    expect(coverResolver).toHaveBeenCalledWith(expect.objectContaining({
      category: 'books',
      title: 'Clean Code',
    }))
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
    const title = screen.getByRole('heading', { name: 'Editar interés' })
    const header = title.closest('[data-slot="drawer-header"]')
    const contentColumn = header?.parentElement
    const titleInput = screen.getByLabelText('Título')
    const tagsInput = screen.getByLabelText('Etiquetas')
    const notesInput = screen.getByLabelText('Notas')

    const deleteButton = screen.getByRole('button', { name: 'Eliminar interés' })
    const saveButton = screen.getByRole('button', { name: 'Guardar cambios' })
    const footer = saveButton.closest('[data-slot="drawer-footer"]')
    const form = titleInput.closest('form')

    expect(title).toBeInTheDocument()
    expect(screen.queryByText('Actualiza los detalles guardados y mantén el elemento en tu dashboard.')).not.toBeInTheDocument()
    expect(screen.queryByText('Detalles')).not.toBeInTheDocument()
    expect(titleInput).toBeVisible()
    expect(tagsInput).toBeVisible()
    expect(notesInput).toBeVisible()
    expect(categoryBadge).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(contentColumn?.parentElement).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto')
    expect(footer).toHaveClass('shrink-0', 'border-t')
    expect(footer).not.toBe(contentColumn?.parentElement)
    expect(deleteButton.closest('form')).toBeNull()
    expect(saveButton.closest('form')).toBeNull()
    expect(saveButton).toHaveAttribute('form', form?.id)
    expect(deleteButton).toHaveAttribute('type', 'button')
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

  it('shows an existing cover preview, lets users remove it, and clears the cover metadata on save', async () => {
    const repository = createMockInterestRepository([
      {
        id: 'series-old',
        category: 'series',
        title: 'Severance',
        status: 'pending',
        tags: ['office'],
        createdAt: '2026-06-01T08:00:00.000Z',
        coverImageUrl: 'https://images.example.com/severance.jpg',
        coverMatchedTitle: 'Severance',
        coverProvider: 'tmdb',
      },
    ])
    const onUpdated = vi.fn()

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveEditFlow
          isDesktop
          itemId="series-old"
          onUpdated={onUpdated}
          repository={repository}
        />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('img', { name: 'Cover preview' })).toHaveAttribute('src', 'https://images.example.com/severance.jpg')
    expect(screen.getByText(hasExactText('Matched title: Severance'))).toBeVisible()
    expect(screen.getByText(hasExactText('Provider: TMDB'))).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }))

    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Cover preview' })).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1)
    })

    const [updatedItem] = await repository.listItems()

    expect(updatedItem?.title).toBe('Severance')
    expect(updatedItem?.coverImageUrl).toBeUndefined()
    expect(updatedItem?.coverMatchedTitle).toBeUndefined()
    expect(updatedItem?.coverProvider).toBeUndefined()
  })

  it('shows no-cover feedback when an edit lookup finds nothing and still allows saving', async () => {
    const repository = createMockInterestRepository([
      {
        id: 'movie-old',
        category: 'movies',
        title: 'Arrival',
        status: 'pending',
        tags: ['sci-fi'],
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ])
    const onUpdated = vi.fn()
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue(null)

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveEditFlow coverResolver={coverResolver} isDesktop itemId="movie-old" onUpdated={onUpdated} repository={repository} />
      </LocaleProvider>,
    )

    const titleInput = await screen.findByLabelText('Title')

    fireEvent.change(titleInput, { target: { value: 'Arrival (2016)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    expect(await screen.findByText('No cover found. You can still save without one.')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1)
    })

    const [updatedItem] = await repository.listItems()

    expect(updatedItem).toMatchObject({
      title: 'Arrival (2016)',
      category: 'movies',
    })
    expect(updatedItem?.coverImageUrl).toBeUndefined()
  })

  it('persists the full resolved cover metadata set after an explicit successful edit lookup', async () => {
    const repository = createMockInterestRepository([
      {
        id: 'movie-old',
        category: 'movies',
        title: 'Arrival',
        status: 'pending',
        tags: ['sci-fi'],
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ])
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/blade-runner.jpg',
      coverMatchedTitle: 'Blade Runner 2049',
      coverProvider: 'tmdb',
    })

    render(
      <LocaleProvider initialLocale="en">
        <AdaptiveEditFlow coverResolver={coverResolver} isDesktop itemId="movie-old" repository={repository} />
      </LocaleProvider>,
    )

    const titleInput = await screen.findByLabelText('Title')

    fireEvent.change(titleInput, { target: { value: 'Blade Runner 2049' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))

    await screen.findByRole('img', { name: 'Cover preview' })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(async () => {
      const [updatedItem] = await repository.listItems()

      expect(updatedItem).toMatchObject({
        title: 'Blade Runner 2049',
        coverImageUrl: 'https://images.example.com/blade-runner.jpg',
        coverMatchedTitle: 'Blade Runner 2049',
        coverProvider: 'tmdb',
      })
    })
  })
})
