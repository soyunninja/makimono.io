import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardScreen } from '@/features/items/dashboard-screen'
import {
  createMockInterestRepository,
  defaultMockItems,
  resetAppInterestRepository,
} from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('DashboardScreen', () => {
  it('renders the five first-class category cards behind the local mock repository', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests backlog' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Local data only')).toBeInTheDocument()
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
      await screen.findByRole('heading', { level: 1, name: 'Your interests backlog' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByText('Language')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ES' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Tu lista de intereses' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Añadir interés' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir sugerencias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archivo' })).toBeInTheDocument()
    expect(screen.getByText('Idioma')).toBeInTheDocument()
  })

  it('switches visible UI text back to English when the app starts in Spanish', async () => {
    render(
      <LocaleProvider initialLocale="es">
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tu lista de intereses' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Añadir interés' })).toBeInTheDocument()
    expect(screen.getByText('Idioma')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Your interests backlog' })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByText('Language')).toBeInTheDocument()
  })

  it('resets local mock changes after a reload instead of treating them as persisted', async () => {
    resetAppInterestRepository()

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
        <DashboardScreen />
      </LocaleProvider>,
    )

    await screen.findByRole('heading', { level: 2, name: 'Arrival' })
    fireEvent.click(screen.getByRole('radio', { name: 'Movies' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })

    expect(screen.getByText('Planned')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start now' })).toBeInTheDocument()

    resetAppInterestRepository()
  })

  it('applies responsive layout and touch-friendly action classes for desktop and mobile scanning', async () => {
    render(
      <LocaleProvider>
        <DashboardScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    const articles = await screen.findAllByRole('article')
    const cardsGrid = articles[0]?.parentElement

    expect(cardsGrid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', '2xl:grid-cols-3')
    expect(screen.getByRole('radiogroup', { name: 'Category filters' })).toHaveClass('flex-wrap')
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveClass('h-11')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveClass('h-11')

    const statusButton = screen.getByRole('button', { name: 'Mark as watched' })

    expect(statusButton).toHaveClass('h-11', 'w-full', 'sm:w-auto')
    expect(statusButton.parentElement).toHaveClass(
      'mt-auto',
      'flex-col',
      'items-stretch',
      'sm:flex-row',
      'sm:items-center',
    )
  })

  it('renders long card content without clipping and preserves usable controls', async () => {
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

    expect(title).toHaveClass('text-balance', 'break-words')
    expect(within(article).getByText(longNotes)).toBeInTheDocument()
    expect(article).toHaveClass('flex', 'h-full', 'flex-col')
    expect(actionButton).toHaveClass('h-11', 'w-full', 'sm:w-auto')
    expect(actionButton.parentElement).toHaveClass('flex-col', 'items-stretch', 'sm:flex-row')
  })
})
