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
  it('renders the five first-class category cards behind the local mock repository', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(5)

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

    expect(screen.getByRole('button', { name: 'Mark as watched' })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Mark as watched' })).toBeInTheDocument()
  })

  it('exposes accessible filters, navigation actions, and usable status controls', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    await screen.findAllByRole('article')

    const getArrivalCard = () => screen.getByRole('heading', { level: 2, name: 'Arrival' }).closest('[role="article"]') as HTMLElement
    const completedCard = screen.getByRole('heading', { level: 2, name: 'Celeste' }).closest('[role="article"]') as HTMLElement

    expect(screen.getByRole('radiogroup', { name: 'Category filters' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/dashboard/add')
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toHaveAttribute('href', '/dashboard/suggest')
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')

    const arrivalAction = within(getArrivalCard()).getByRole('button', { name: 'Start now' })

    expect(arrivalAction).toBeEnabled()
    expect(within(completedCard).getByRole('button', { name: 'Completed' })).toBeDisabled()

    fireEvent.click(arrivalAction)

    await waitFor(() => {
      expect(within(getArrivalCard()).getByText('In progress')).toBeInTheDocument()
    })

    expect(within(getArrivalCard()).getByRole('button', { name: 'Mark as watched' })).toBeEnabled()
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

    expect(within(screen.getByRole('article')).getByRole('button', { name: 'Mark as watched' })).toBeEnabled()
  })
})
