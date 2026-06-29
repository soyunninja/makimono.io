import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  it('uses the plain archive shell with compact completed cards', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument()
    expect(screen.queryByText('Review completed items, inspect deleted ones, and restore whatever should return to the dashboard.')).not.toBeInTheDocument()
    expect(screen.queryByText('Restore a completed item to move it back to the pending backlog.')).not.toBeInTheDocument()

    const completedArticle = await screen.findByRole('article')

    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Games')).toHaveLength(1)
    expect(within(completedArticle).getByText('Completed')).toBeInTheDocument()
    expect(within(completedArticle).getByRole('button', { name: 'Restore: Celeste' })).toBeInTheDocument()
    expect(within(completedArticle).getByText('platformer').closest('[data-slot="badge"]')).not.toBeNull()
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
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={getAppInterestRepository([])} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()
    expect(screen.getByText('Hades II')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore: Hades II' })).toBeInTheDocument()
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
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Deleted items' })).toBeInTheDocument()
    expect(screen.getByText('Domain-Driven Design')).toBeInTheDocument()
    expect(screen.getByText('Floating Points — Promises')).toBeInTheDocument()
    expect(screen.getByText('Deleted')).toBeInTheDocument()
    expect(screen.getAllByText('Planned')).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Restore: Domain-Driven Design' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore: Floating Points — Promises' })).toBeInTheDocument()
    expect(screen.queryByText('Restore a deleted item to make it active on the dashboard again.')).not.toBeInTheDocument()
  })

  it('keeps the empty state when no archived items exist', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={createMockInterestRepository([])} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByText('Nothing is archived yet')).toBeInTheDocument()
    expect(screen.getByText('Complete or delete an item on the dashboard to see it here.')).toBeInTheDocument()
  })

  it('restores a completed item out of the archive list', async () => {
    const repository = createMockInterestRepository([])
    const created = await repository.createItem({
      category: 'games',
      title: 'Outer Wilds',
      tags: ['loop'],
    })

    await repository.updateStatus(created.id, 'completed')

    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByText('Outer Wilds')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore: Outer Wilds' }))

    await waitFor(() => {
      expect(screen.queryByText('Outer Wilds')).not.toBeInTheDocument()
    })
  })
})
