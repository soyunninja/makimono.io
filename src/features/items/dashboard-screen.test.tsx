import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardScreen } from '@/features/items/dashboard-screen'
import { createMockInterestRepository } from '@/features/items/mock-repository'
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
})
