import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DashboardScreen } from '@/features/items/dashboard-screen'
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
  window.localStorage.clear()
  resetAppInterestRepository()
})

describe('DashboardScreen', () => {
  it('renders only active category cards behind the local mock repository', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(4)
    expect(screen.queryByRole('heading', { level: 2, name: 'Celeste' })).not.toBeInTheDocument()

    expect(screen.getByRole('radio', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Series' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Movies' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Games' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Books' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Websites' })).toBeInTheDocument()
  })

  it('filters the visible cards by category', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByRole('heading', { level: 2, name: 'Atomic Habits' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Severance' })).not.toBeInTheDocument()

    const booksFilter = screen.getByRole('radio', { name: 'Books' })
    const article = screen.getByRole('article')

    expect(booksFilter).toHaveAttribute('aria-checked', 'true')
    expect(within(article).getByText('Books')).toBeInTheDocument()
  })

  it('keeps status changes local and advances a pending movie into progress', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })

    fireEvent.click(screen.getByRole('radio', { name: 'Movies' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByText('Planned')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start now' }))

    await waitFor(() => {
      expect(screen.getByText('In progress')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Mark as watched' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
  })

  it('keeps the completion trigger in the card header, without the old footer action label or card date', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const atomicHabitsCard = (await screen.findByRole('heading', { level: 2, name: 'Atomic Habits' })).closest('[role="article"]') as HTMLElement

    expect(within(atomicHabitsCard).queryByText(formatCardDate(defaultMockItems[3].createdAt, 'en'))).not.toBeInTheDocument()
    expect(within(atomicHabitsCard).queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument()

    const completionTrigger = within(atomicHabitsCard).getByRole('button', { name: 'Mark as read: Atomic Habits' })
    const cardHeading = within(atomicHabitsCard).getByRole('heading', { level: 2, name: 'Atomic Habits' })

    expect(completionTrigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(completionTrigger.compareDocumentPosition(cardHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('opens a completion confirmation modal from the radio-style control', async () => {
    render(
      <LocaleProvider>
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
      <LocaleProvider>
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
      <LocaleProvider>
        <DashboardScreen repository={repository} />
      </LocaleProvider>,
    )

    fireEvent.click(await screen.findByRole('radio', { name: 'Books' }))

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

  it('switches the visible dashboard copy when the language toggle changes locale', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ES' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Tus intereses' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Añadir interés' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir sugerencias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archivo' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
  })

  it('switches visible UI text back to English when the app starts in Spanish', async () => {
    render(
      <LocaleProvider initialLocale="es">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tus intereses' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Añadir interés' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
  })

  it('reloads repository items when the dashboard returns from the add flow', async () => {
    const repository = resetAppInterestRepository([])

    const dashboard = render(
      <LocaleProvider>
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
      <LocaleProvider>
        <DashboardScreen reloadKey={'/dashboard'} repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Deep Work' })).toBeInTheDocument()
  })

  it('exposes the text content area as the edit link without separate dashboard edit or delete buttons', async () => {
    render(
      <LocaleProvider>
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
      <LocaleProvider>
        <DashboardScreen />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })
    fireEvent.click(screen.getByRole('radio', { name: 'Movies' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Start now' }))

    await waitFor(() => {
      expect(screen.getByText('In progress')).toBeInTheDocument()
    })

    firstRender.unmount()
    resetAppInterestRepository()

    render(
      <LocaleProvider>
        <DashboardScreen repository={getAppInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })
    fireEvent.click(screen.getByRole('radio', { name: 'Movies' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark as watched: Arrival' })).toBeInTheDocument()
  })

  it('exposes accessible filters, navigation actions, and usable status controls', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findAllByRole('article')

    const getArrivalCard = () => screen.getByRole('heading', { level: 2, name: 'Arrival' }).closest('[role="article"]') as HTMLElement
    expect(screen.getByRole('radiogroup', { name: 'Category filters' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/dashboard/add')
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toHaveAttribute('href', '/dashboard/suggest')
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { level: 2, name: 'Celeste' })).not.toBeInTheDocument()

    const arrivalAction = within(getArrivalCard()).getByRole('button', { name: 'Start now' })
    expect(arrivalAction).toBeEnabled()

    fireEvent.click(arrivalAction)

    await waitFor(() => {
      expect(within(getArrivalCard()).getByText('In progress')).toBeInTheDocument()
    })

    expect(within(getArrivalCard()).getByRole('button', { name: 'Mark as watched: Arrival' })).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('renders long card content in a readable article and preserves the visible action', async () => {
    const longTitle =
      'The incredibly long mock title that should wrap across multiple lines without clipping the backlog card content or hiding the action controls'
    const longNotes =
      'This note intentionally stretches the card copy so the dashboard has to grow naturally while still keeping the footer readable and actionable.'

    render(
      <LocaleProvider>
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
    const actionButton = within(article).getByRole('button', { name: 'Start now' })

    expect(title).toBeVisible()
    expect(within(article).getByText(longNotes)).toBeInTheDocument()
    expect(article).toHaveAttribute('role', 'article')
    expect(actionButton).toBeEnabled()

    fireEvent.click(actionButton)

    await waitFor(() => {
      expect(within(screen.getByRole('article')).getByText('In progress')).toBeInTheDocument()
    })

    expect(within(screen.getByRole('article')).getByRole('button', { name: `Mark as watched: ${longTitle}` })).toHaveAttribute('aria-haspopup', 'dialog')
  })
})
