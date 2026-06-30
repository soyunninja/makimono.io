import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardScreen } from '@/features/items/dashboard-screen'
import { writeDashboardDisplayPreference } from '@/features/items/dashboard-display-preference'
import {
  createMockInterestRepository,
  defaultMockItems,
  getAppInterestRepository,
  resetAppInterestRepository,
} from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'

function formatCardDate(createdAt: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(createdAt))
}

beforeEach(() => {
  installMockLocalStorage()
  window.localStorage.clear()
  resetAppInterestRepository()
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  resetAppInterestRepository()
})

describe('DashboardScreen', () => {
  it('renders only active category cards behind the local mock repository', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests' }),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-cards-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-covers-grid')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(4)
    expect(screen.queryByRole('heading', { level: 2, name: 'Celeste' })).not.toBeInTheDocument()

    expect(screen.queryByText('Category filters')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'All (4)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Series (1)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Movies (1)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Games (0)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Books (1)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Music (1)' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Podcasts (0)' })).toBeInTheDocument()

    expect(screen.queryByText('Track mock items by category and move them through the backlog.')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('groups list display items by category and renders only the colored action icon plus title', async () => {
    writeDashboardDisplayPreference('list')

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const list = await screen.findByTestId('dashboard-list')

    expect(list).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-cards-grid')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-covers-grid')).not.toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(4)

    const seriesHeading = within(list).getByRole('heading', { level: 2, name: 'Series' })
    const moviesHeading = within(list).getByRole('heading', { level: 2, name: 'Movies' })
    const booksHeading = within(list).getByRole('heading', { level: 2, name: 'Books' })
    const musicHeading = within(list).getByRole('heading', { level: 2, name: 'Music' })
    const severanceLink = within(list).getByRole('link', { name: 'Edit: Severance' })
    const arrivalLink = within(list).getByRole('link', { name: 'Edit: Arrival' })
    const arrivalArticle = arrivalLink.closest('article') as HTMLElement
    const arrivalAction = within(arrivalArticle).getByRole('button', { name: 'Start now: Arrival' })

    expect(seriesHeading.compareDocumentPosition(severanceLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(moviesHeading.compareDocumentPosition(arrivalLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(booksHeading).toBeInTheDocument()
    expect(musicHeading).toBeInTheDocument()
    expect(moviesHeading.nextElementSibling).toHaveClass('xl:grid-cols-3')
    expect(arrivalAction).toHaveClass('text-accent-red')
    expect(arrivalLink).toHaveClass('text-accent-red')
    expect(arrivalArticle.textContent?.trim()).toBe('Arrival')
    expect(within(arrivalArticle).queryByText('Movies')).not.toBeInTheDocument()
    expect(within(arrivalArticle).queryByText('Planned')).not.toBeInTheDocument()
    expect(within(arrivalArticle).queryByText('Keep for a focused evening.')).not.toBeInTheDocument()
    expect(within(arrivalArticle).queryByText('drama')).not.toBeInTheDocument()

    fireEvent.click(arrivalAction)

    await waitFor(() => {
      expect(within(list).getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
    })

    expect(within(list).queryByText('In progress')).not.toBeInTheDocument()
  })

  it('renders cards with started items before pending items and keeps the loaded random order while filtering', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const cardsGrid = await screen.findByTestId('dashboard-cards-grid')

    expect(within(cardsGrid).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Atomic Habits',
      'Severance',
      'Nujabes — Modal Soul',
      'Arrival',
    ])
    expect(screen.queryByRole('heading', { level: 2, name: 'Celeste' })).not.toBeInTheDocument()
    expect(random).toHaveBeenCalledTimes(2)

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search by title, tag, or notes' }),
      { target: { value: 'arrival' } },
    )

    await waitFor(() => {
      expect(within(cardsGrid).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
        'Arrival',
      ])
    })
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('renders list display with one section per category and started items before pending items inside it', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    writeDashboardDisplayPreference('list')

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen
          repository={createMockInterestRepository([
            {
              ...defaultMockItems[3],
              id: 'book-first',
              title: 'Book First',
            },
            {
              ...defaultMockItems[0],
              id: 'series-middle',
              title: 'Series Middle',
            },
            {
              ...defaultMockItems[3],
              id: 'book-second',
              title: 'Book Second',
            },
            {
              ...defaultMockItems[3],
              id: 'book-pending',
              title: 'Book Pending',
              status: 'pending',
            },
            {
              ...defaultMockItems[1],
              id: 'movie-pending',
              title: 'Movie Pending',
            },
          ])}
        />
      </LocaleProvider>,
    )

    const list = await screen.findByTestId('dashboard-list')
    const booksHeading = within(list).getByRole('heading', { level: 2, name: 'Books' })
    const booksSection = booksHeading.closest('section') as HTMLElement

    expect(within(list).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Book First',
      'Book Second',
      'Book Pending',
      'Series Middle',
      'Movie Pending',
    ])
    expect(within(list).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Books',
      'Series',
      'Movies',
    ])
    expect(within(list).getAllByRole('heading', { level: 2, name: 'Books' })).toHaveLength(1)
    expect(within(booksSection).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Book First',
      'Book Second',
      'Book Pending',
    ])
  })

  it('renders cover display in the same started-before-pending loaded order', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    writeDashboardDisplayPreference('covers')

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const coversGrid = await screen.findByTestId('dashboard-covers-grid')

    expect(within(coversGrid).getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Edit: Atomic Habits',
      'Edit: Severance',
      'Edit: Nujabes — Modal Soul',
      'Edit: Arrival',
    ])
  })

  it('renders cover display as cover-only tiles with top-left action controls and accessible fallbacks', async () => {
    writeDashboardDisplayPreference('covers')

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen
          repository={createMockInterestRepository([
            {
              ...defaultMockItems[0],
              coverImageUrl: 'https://example.test/severance.jpg',
            },
            {
              ...defaultMockItems[1],
              coverImageUrl: 'https://example.test/arrival.jpg',
            },
            {
              ...defaultMockItems[3],
              coverImageUrl: undefined,
            },
          ])}
        />
      </LocaleProvider>,
    )

    const coversGrid = await screen.findByTestId('dashboard-covers-grid')

    expect(coversGrid).toBeInTheDocument()
    expect(coversGrid).toHaveClass('columns-2', 'lg:columns-3', 'xl:columns-4')
    expect(coversGrid).not.toHaveClass('grid', 'xl:grid-cols-3')
    expect(screen.queryByTestId('dashboard-cards-grid')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-list')).not.toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(3)

    const coverImages = screen.getAllByTestId('dashboard-cover-image')
    const severanceAction = screen.getByRole('button', { name: 'Mark as watched: Severance' })
    const arrivalAction = screen.getByRole('button', { name: 'Start now: Arrival' })

    expect(coverImages).toHaveLength(2)
    expect(coverImages[0]).toHaveClass('block', 'h-auto', 'w-full')
    expect(coverImages[0]).not.toHaveClass('max-h-[32rem]')
    expect(coverImages[0]).not.toHaveClass('object-contain')
    expect(coverImages[0]).not.toHaveClass('object-cover')
    expect(coverImages[0].closest('article')).toHaveClass('break-inside-avoid')
    expect(screen.getByTestId('dashboard-cover-fallback')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit: Severance' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit: Atomic Habits' })).toBeInTheDocument()
    expect(severanceAction).toHaveClass('absolute', 'left-3', 'top-3', 'text-accent-purple')
    expect(arrivalAction).toHaveClass('absolute', 'left-3', 'top-3', 'text-accent-red')
    expect(screen.queryByRole('heading', { level: 2, name: 'Severance' })).not.toBeInTheDocument()
    expect(screen.queryByText('Severance')).not.toBeInTheDocument()
    expect(screen.queryByText('Season 2 is next in the queue.')).not.toBeInTheDocument()
    expect(screen.queryByText('sci-fi')).not.toBeInTheDocument()
    expect(screen.queryByText('In progress')).not.toBeInTheDocument()

    fireEvent.click(arrivalAction)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
    })

    expect(screen.queryByText('Arrival')).not.toBeInTheDocument()
    expect(screen.queryByText('In progress')).not.toBeInTheDocument()

    fireEvent.click(severanceAction)

    expect(await screen.findByRole('heading', { name: 'Mark as watched' })).toBeInTheDocument()
    expect(screen.getByText('This will remove the item from your dashboard and move it to the archive.')).toBeInTheDocument()
  })

  it('falls back to cards when the stored dashboard preference is invalid', async () => {
    window.localStorage.setItem('meinteresa.dashboardDisplayPreference', 'invalid-layout')

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(await screen.findByTestId('dashboard-cards-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-covers-grid')).not.toBeInTheDocument()
  })

  it('filters the visible cards by category', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })

    fireEvent.click(screen.getByRole('radio', { name: 'Books (1)' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Atomic Habits' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Severance' })).not.toBeInTheDocument()

    const booksFilter = screen.getByRole('radio', { name: 'Books (1)' })
    const article = screen.getByRole('article')

    expect(booksFilter).toHaveAttribute('aria-checked', 'true')
    expect(within(article).getByText('Books')).toBeInTheDocument()
  })

  it('filters visible items by title search', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search by title, tag, or notes' }),
      { target: { value: 'arrival' } },
    )

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Arrival' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Atomic Habits' })).not.toBeInTheDocument()
  })

  it('filters visible items by tag or notes search', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })

    const searchInput = screen.getByRole('searchbox', { name: 'Search by title, tag, or notes' })

    fireEvent.change(searchInput, { target: { value: 'spotify' } })

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Nujabes — Modal Soul' })).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'focused evening' } })

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Arrival' })).toBeInTheDocument()
  })

  it('combines category and search filters', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })

    fireEvent.click(screen.getByRole('radio', { name: 'Books (1)' }))
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search by title, tag, or notes' }),
      { target: { value: 'chapters' } },
    )

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Atomic Habits' })).toBeInTheDocument()

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search by title, tag, or notes' }),
      { target: { value: 'arrival' } },
    )

    await waitFor(() => {
      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })

    expect(screen.getByText('No items match this search')).toBeInTheDocument()
    expect(screen.getByText('Try a different title, tag, note, or category.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Books (1)' })).toBeInTheDocument()
  })

  it('keeps status changes local and advances a pending movie into progress', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })

    fireEvent.click(screen.getByRole('radio', { name: 'Movies (1)' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    const arrivalCard = screen.getByRole('heading', { level: 2, name: 'Arrival' }).closest('[role="article"]') as HTMLElement
    const startButton = within(arrivalCard).getByRole('button', { name: 'Start now: Arrival' })

    expect(within(arrivalCard).getByText('Planned')).toBeInTheDocument()
    expect(within(arrivalCard).queryByRole('button', { name: 'Start now' })).not.toBeInTheDocument()
    expect(within(arrivalCard).queryByText('Start now')).not.toBeInTheDocument()
    expect(startButton).not.toHaveTextContent('Start now')

    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('In progress')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Mark as watched' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
  })

  it('keeps the completion trigger in the card header, without the old footer action label or card date', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const atomicHabitsCard = (await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })).closest('[role="article"]') as HTMLElement

    expect(within(atomicHabitsCard).queryByText(formatCardDate(defaultMockItems[3].createdAt, 'en'))).not.toBeInTheDocument()
    expect(within(atomicHabitsCard).queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument()

    const completionTrigger = within(atomicHabitsCard).getByRole('button', { name: 'Mark as read: Atomic Habits' })
    expect(completionTrigger).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('opens a completion confirmation modal from the radio-style control', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const atomicHabitsCard = (await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })).closest('[role="article"]') as HTMLElement

    fireEvent.click(within(atomicHabitsCard).getByRole('button', { name: 'Mark as read: Atomic Habits' }))

    expect(await screen.findByRole('heading', { name: 'Mark as read' })).toBeInTheDocument()
    expect(screen.getByText('This will remove the item from your dashboard and move it to the archive.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('keeps an item active when the completion confirmation is canceled', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const atomicHabitsCard = (await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })).closest('[role="article"]') as HTMLElement

    fireEvent.click(within(atomicHabitsCard).getByRole('button', { name: 'Mark as read: Atomic Habits' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Mark as read' })).not.toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Atomic Habits' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('removes an item from the dashboard after confirming completion', async () => {
    const repository = createMockInterestRepository()

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(await screen.findByRole('radio', { name: 'Books (1)' }))

    const atomicHabitsCard = await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })
    expect(atomicHabitsCard).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark as read: Atomic Habits' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mark as read' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: 'Atomic Habits' })).not.toBeInTheDocument()
    })

    expect(screen.getByText('No items match this category yet')).toBeInTheDocument()
    expect(screen.getByText('Try another category.')).toBeInTheDocument()
    expect((await repository.listItems()).find((item) => item.id === 'book-atomic-habits')?.status).toBe('completed')
  })

  it('hides the language selector from the visible dashboard actions', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.queryByRole('menuitem', { name: 'Get suggestions' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument()
  })

  it('keeps the dashboard copy localized when the app starts in Spanish without showing the selector', async () => {
    render(
      <LocaleProvider initialLocale="es">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Makimono' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Añadir interés' })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Más acciones' }))
    expect(screen.queryByRole('menuitem', { name: 'Pedir sugerencias' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Archivo' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('menuitem', { name: 'Ajustes' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Volver al dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Idioma' })).not.toBeInTheDocument()
    expect(screen.queryByText('Sigue los elementos mock por categoría y muévelos por el backlog.')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('renders icon-only display controls next to the dashboard title and updates the display mode', async () => {
    render(
      <LocaleProvider initialLocale="es">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const title = await screen.findByRole('heading', { level: 1, name: 'Makimono' })
    const titleRow = title.closest('div') as HTMLElement
    const displayControls = within(titleRow).getByRole('radiogroup', { name: 'Visualización del dashboard' })
    const cardsRadio = within(displayControls).getByRole('radio', { name: 'Tarjetas' })
    const listRadio = within(displayControls).getByRole('radio', { name: 'Listado' })
    const coversRadio = within(displayControls).getByRole('radio', { name: 'Carátulas' })

    expect(await screen.findByTestId('dashboard-cards-grid')).toBeInTheDocument()
    expect(cardsRadio).toBeChecked()
    expect(cardsRadio.closest('label')).toHaveAttribute('title', 'Tarjetas')
    expect(cardsRadio.closest('label')).toHaveClass('bg-transparent')
    expect(within(displayControls).queryByText('Tarjetas')).not.toBeInTheDocument()
    expect(within(displayControls).queryByText('Listado')).not.toBeInTheDocument()
    expect(within(displayControls).queryByText('Carátulas')).not.toBeInTheDocument()

    fireEvent.click(listRadio)

    expect(await screen.findByTestId('dashboard-list')).toBeInTheDocument()
    expect(listRadio).toBeChecked()
    expect(screen.queryByTestId('dashboard-cards-grid')).not.toBeInTheDocument()

    fireEvent.click(coversRadio)

    expect(await screen.findByTestId('dashboard-covers-grid')).toBeInTheDocument()
    expect(coversRadio).toBeChecked()
    expect(screen.queryByTestId('dashboard-list')).not.toBeInTheDocument()
  })

  it('groups secondary header actions behind a menu while keeping add visible first', async () => {
    const handleAddItem = vi.fn()
    const handleSuggestItem = vi.fn()

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen
          onAddItem={handleAddItem}
          onSuggestItem={handleSuggestItem}
          repository={createMockInterestRepository()}
        />
      </LocaleProvider>,
    )

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement
    const addAction = within(header).getByRole('button', { name: 'Add interest' })
    const moreActions = within(header).getByRole('button', { name: 'More actions' })

    expect(addAction.compareDocumentPosition(moreActions)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

    fireEvent.pointerDown(moreActions)

    expect(await screen.findByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    fireEvent.click(addAction)

    expect(screen.queryByRole('menuitem', { name: 'Get suggestions' })).not.toBeInTheDocument()
    expect(handleSuggestItem).not.toHaveBeenCalled()
    expect(handleAddItem).toHaveBeenCalledTimes(1)
  })

  it('reloads repository items when the dashboard returns from the add flow', async () => {
    const repository = resetAppInterestRepository([])

    const dashboard = render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen reloadKey={'/dashboard/add'} repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Deep Work' })).not.toBeInTheDocument()

    await repository.createItem({
      category: 'books',
      title: 'Deep Work',
      tags: ['focus'],
    })

    dashboard.rerender(
      <LocaleProvider initialLocale="en">
        <DashboardScreen reloadKey={'/dashboard'} repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Deep Work' })).toBeInTheDocument()
  })

  it('exposes the text content area as the edit link without separate dashboard edit or delete buttons', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const arrivalCard = (await screen.findByRole('heading', { level: 2, name: 'Arrival' })).closest('[role="article"]') as HTMLElement
    const editLink = within(arrivalCard).getByRole('link', { name: 'Edit: Arrival' })

    expect(editLink).toHaveAttribute('href', '/dashboard/edit/movie-arrival')
    expect(editLink).toContainElement(within(arrivalCard).getByRole('heading', { level: 2, name: 'Arrival' }))
    expect(within(arrivalCard).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(within(arrivalCard).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('preserves app-level status changes after repository recreation', async () => {
    const firstRender = render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })
    fireEvent.click(screen.getByRole('radio', { name: 'Movies (1)' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Start now: Arrival' }))

    await waitFor(() => {
      expect(screen.getByText('In progress')).toBeInTheDocument()
    })

    firstRender.unmount()
    resetAppInterestRepository()

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={getAppInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })
    fireEvent.click(screen.getByRole('radio', { name: 'Movies (1)' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
  })

  it('exposes accessible filters, navigation actions, and usable status controls', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findAllByRole('article')

    const getArrivalCard = () => screen.getByRole('heading', { level: 2, name: 'Arrival' }).closest('[role="article"]') as HTMLElement
    expect(screen.getByRole('radiogroup', { name: 'Category filters' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/dashboard/add')
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EN' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Celeste' })).not.toBeInTheDocument()

    const arrivalAction = within(getArrivalCard()).getByRole('button', { name: 'Start now: Arrival' })
    expect(arrivalAction).toBeEnabled()
    expect(within(getArrivalCard()).queryByRole('button', { name: 'Start now' })).not.toBeInTheDocument()

    fireEvent.click(arrivalAction)

    await waitFor(() => {
      expect(within(getArrivalCard()).getByText('In progress')).toBeInTheDocument()
    })

    expect(screen.getByRole('radio', { name: 'All (4)' })).toHaveAttribute('aria-checked', 'true')
    expect(within(getArrivalCard()).getByRole('button', { name: 'Mark as watched: Arrival' })).toHaveAttribute('aria-haspopup', 'dialog')

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.queryByRole('menuitem', { name: 'Get suggestions' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
  })

  it('renders long card content in a readable article and preserves the visible action', async () => {
    const longTitle =
      'The incredibly long mock title that should wrap across multiple lines without clipping the backlog card content or hiding the action controls'
    const longNotes =
      'This note intentionally stretches the card copy so the dashboard has to grow naturally while still keeping the footer readable and actionable.'

    render(
      <LocaleProvider initialLocale="en">
        <DashboardScreen
          repository={createMockInterestRepository([
            {
              ...defaultMockItems[1],
              id: 'movie-long-content',
              title: longTitle,
              notes: longNotes,
              tags: ['longform', 'layout'],
            },
          ])}
        />
      </LocaleProvider>,
    )

    const article = await screen.findByRole('article')
    const title = within(article).getByRole('heading', { level: 2, name: longTitle })
    const actionButton = within(article).getByRole('button', { name: `Start now: ${longTitle}` })

    expect(title).toBeVisible()
    expect(within(article).getByText(longNotes)).toBeInTheDocument()
    expect(actionButton).toBeEnabled()

    fireEvent.click(actionButton)

    await waitFor(() => {
      expect(within(screen.getByRole('article')).getByText('In progress')).toBeInTheDocument()
    })

    expect(within(screen.getByRole('article')).getByRole('button', { name: `Mark as watched: ${longTitle}` })).toHaveAttribute('aria-haspopup', 'dialog')
  })
})
