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
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByText('Review completed items, inspect deleted ones, and restore whatever should return to the dashboard.')).not.toBeInTheDocument()
    expect(screen.queryByText('Restore a completed item to move it back to the pending backlog.')).not.toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))

    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Archive' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    const completedArticle = await screen.findByRole('article')
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Games')).toHaveLength(2)
    expect(screen.getByRole('group', { name: 'Games: 1' })).toBeInTheDocument()
    expect(within(completedArticle).getByText('Completed')).toBeInTheDocument()
    expect(within(completedArticle).getByRole('button', { name: 'Restore: Celeste' })).toBeInTheDocument()
    expect(within(completedArticle).getByText('platformer')).toBeVisible()
  })

  it('shows completed category summary cards for every category', async () => {
    const repository = createMockInterestRepository([])
    const completedGame = await repository.createItem({
      category: 'games',
      title: 'Return of the Obra Dinn',
      tags: ['deduction'],
    })
    const completedBook = await repository.createItem({
      category: 'books',
      title: 'Refactoring',
      tags: ['craft'],
    })
    const deletedAlbum = await repository.createItem({
      category: 'music',
      title: 'Promises',
      tags: ['ambient'],
    })

    await repository.updateStatus(completedGame.id, 'completed')
    await repository.updateStatus(completedBook.id, 'completed')
    await repository.deleteItem(deletedAlbum.id)

    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()

    expect(screen.getByTestId('archive-category-summary-grid')).toHaveClass('grid-cols-2', 'gap-2', 'md:grid-cols-3', 'xl:grid-cols-6')

    expect(screen.getByRole('group', { name: 'Series: 0' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Movies: 0' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Games: 1' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Books: 1' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Music: 0' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Podcasts: 0' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore: Return of the Obra Dinn' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore: Refactoring' })).toBeInTheDocument()
  })

  it('filters archived items by title, tag, and notes without changing category summaries', async () => {
    const repository = createMockInterestRepository([])
    const completedGame = await repository.createItem({
      category: 'games',
      title: 'Return of the Obra Dinn',
      notes: 'Insurance mysteries aboard the ship.',
      tags: ['deduction'],
    })
    const completedBook = await repository.createItem({
      category: 'books',
      title: 'Refactoring',
      notes: 'Revisit the code smells chapter.',
      tags: ['craft'],
    })
    const deletedAlbum = await repository.createItem({
      category: 'music',
      title: 'Promises',
      notes: 'Keep this for the ambient mornings.',
      tags: ['ambient'],
    })

    await repository.updateStatus(completedGame.id, 'completed')
    await repository.updateStatus(completedBook.id, 'completed')
    await repository.deleteItem(deletedAlbum.id)

    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'Completed items' })).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: 'Search archived items by title, tag, or notes' })

    fireEvent.change(searchInput, { target: { value: 'deduction' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore: Return of the Obra Dinn' })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Restore: Refactoring' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restore: Promises' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Games: 1' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Books: 1' })).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'code smells' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore: Refactoring' })).toBeInTheDocument()
    })

    fireEvent.change(searchInput, { target: { value: 'promises' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore: Promises' })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Restore: Return of the Obra Dinn' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restore: Refactoring' })).not.toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'no-match-query' } })

    await waitFor(() => {
      expect(screen.getByText('No archived items match this search')).toBeInTheDocument()
    })

    expect(screen.getByText('Try a different title, tag, or note.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Games: 1' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Books: 1' })).toBeInTheDocument()
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

  it('keeps archived items readable when cached cover metadata exists', async () => {
    const repository = createMockInterestRepository([])
    const completedItem = await repository.createItem({
      category: 'games',
      title: 'Celeste',
      tags: ['platformer'],
      coverImageUrl: 'https://images.example.com/celeste.jpg',
      coverMatchedTitle: 'Celeste',
      coverProvider: 'rawg',
    })

    await repository.updateStatus(completedItem.id, 'completed')

    render(
      <LocaleProvider initialLocale="en">
        <ArchiveScreen repository={repository} />
      </LocaleProvider>,
    )

    const article = (await screen.findByText('Celeste')).closest('[role="article"]') as HTMLElement

    expect(within(article).getByText('Completed')).toBeInTheDocument()
    expect(within(article).getByText('platformer')).toBeInTheDocument()
    expect(within(article).getByRole('button', { name: 'Restore: Celeste' })).toBeInTheDocument()
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
