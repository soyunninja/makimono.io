import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ArchiveScreen } from '@/features/items/archive-screen'
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

describe('ArchiveScreen', () => {
  it('keeps category colors visible in summary cards and completed item badges', async () => {
    render(
      <LocaleProvider>
        <ArchiveScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()

    const [gamesSummary, categoryBadge] = screen.getAllByText('Games')
    const completedArticle = await screen.findByRole('article')

    expect(gamesSummary).toHaveClass('text-accent-green')
    expect(gamesSummary.closest('[data-slot="card"]')).toHaveClass('bg-accent-green/10')
    expect(completedArticle).toHaveClass('border-accent-green/30', 'bg-accent-green/10')
    expect(categoryBadge).toHaveClass('bg-accent-green/10', 'text-accent-green')
  })

  it('shows completed items from the recreated app repository after reload', async () => {
    const repository = resetAppInterestRepository([])
    const created = await repository.createItem({
      category: 'games',
      title: 'Hades II',
      tags: ['roguelike'],
    })

    await repository.updateStatus(created.id, 'completed')
    resetAppInterestRepository([])

    render(
      <LocaleProvider>
        <ArchiveScreen repository={getAppInterestRepository([])} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()
    expect(screen.getByText('Hades II')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
  })

  it('shows deleted items in a separate section with deleted-specific badges', async () => {
    const repository = createMockInterestRepository([])
    const deletedItem = await repository.createItem({
      category: 'music',
      title: 'Floating Points — Promises',
      tags: ['bandcamp'],
    })
    const completedItem = await repository.createItem({
      category: 'books',
      title: 'Domain-Driven Design',
      tags: ['architecture'],
    })

    await repository.deleteItem(deletedItem.id)
    await repository.updateStatus(completedItem.id, 'completed')

    render(
      <LocaleProvider>
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Deleted items' })).toBeInTheDocument()
    expect(screen.getByText('Domain-Driven Design')).toBeInTheDocument()
    expect(screen.getByText('Floating Points — Promises')).toBeInTheDocument()
    expect(screen.getByText('Deleted')).toBeInTheDocument()
    expect(screen.getAllByText('Planned')).not.toHaveLength(0)
  })
})
