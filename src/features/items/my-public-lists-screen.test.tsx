import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MyPublicListsScreen } from '@/features/items/my-public-lists-screen'
import type { PublicListManagementSummary, PublicListRepository } from '@/features/items/public-list-repository'
import { LocaleProvider } from '@/i18n/locale-provider'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function createRepository(listMine: PublicListRepository['listMine'], deleteManagedList: PublicListRepository['deleteManagedList'] = vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true }))): PublicListRepository {
  return {
    createManagedList: vi.fn<PublicListRepository['createManagedList']>(),
    deleteManagedList,
    getByOwnerAndSlug: vi.fn(async () => null),
    getManagedList: vi.fn<PublicListRepository['getManagedList']>(),
    listByOwner: vi.fn<PublicListRepository['listByOwner']>(async () => null),
    listMine,
    publishList: vi.fn<PublicListRepository['publishList']>(async () => ({ error: { type: 'unauthenticated' }, ok: false })),
    updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(),
  }
}

function renderScreen(repository: PublicListRepository) {
  render(
    <LocaleProvider initialLocale={'en'}>
      <MyPublicListsScreen authenticatedOwnerId={'user-private'} repository={repository} />
    </LocaleProvider>,
  )
}

const publicLists: PublicListManagementSummary[] = [
  {
    id: 'list-summer-books',
    ownerNamespace: 'mariano',
    slug: 'summer-books',
    title: 'Summer Books',
    listDate: '2026-07-03',
    publishedAt: '2026-07-03T12:00:00.000Z',
  },
]

describe('MyPublicListsScreen', () => {
  it('shows a loading state while owner public lists are pending', async () => {
    const deferred = createDeferred<PublicListManagementSummary[]>()

    renderScreen(createRepository(vi.fn(() => deferred.promise)))

    const heading = screen.getByRole('heading', { level: 1, name: 'My public lists' })
    const header = heading.closest('section') as HTMLElement

    expect(heading).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Create public list' })).toHaveAttribute('href', '/dashboard/public-lists/new')
    expect(screen.getByText('Loading your public lists…')).toBeInTheDocument()

    deferred.resolve([])

    expect(await screen.findByText('No public lists created yet')).toBeInTheDocument()
  })

  it('shows an empty state when no published lists are returned', async () => {
    renderScreen(createRepository(vi.fn(async () => [])))

    expect(await screen.findByText('No public lists created yet')).toBeInTheDocument()
    expect(screen.getByText('Create a public list and add interests to it when you are ready.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create public list' })).toHaveAttribute('href', '/dashboard/public-lists/new')
  })

  it('shows a generic error state without private diagnostics', async () => {
    renderScreen(createRepository(vi.fn(async () => {
      throw new Error('PocketBase token user-private@example.com stack trace')
    })))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your public lists')
    expect(screen.getByText('Check your session and try again. Private diagnostic details are not shown here.')).toBeInTheDocument()
    expect(screen.queryByText(/user-private@example\.com/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument()
  })

  it('renders public route targets and localized fallback descriptions', async () => {
    renderScreen(createRepository(vi.fn(async () => publicLists)))

    expect(await screen.findByRole('heading', { level: 1, name: 'My public lists' })).toBeInTheDocument()
    expect(screen.getByText('Summer Books')).toBeInTheDocument()
    expect(screen.getByText('No description')).toBeInTheDocument()
    expect(screen.queryByText('/u/mariano/summer-books')).not.toBeInTheDocument()
    expect(screen.getByText('July 03, 2026')).toBeInTheDocument()
    expect(screen.queryByText('2026-07-03')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage list: Summer Books' })).toHaveAttribute('href', '/dashboard/public-lists/list-summer-books')
    expect(screen.getByRole('link', { name: 'Open public URL: Summer Books' })).toHaveAttribute('href', '/u/mariano/summer-books')
    expect(screen.getByRole('link', { name: 'Open public URL: Summer Books' }).closest('a')).toHaveAttribute('title', 'Open Summer Books')
    expect(screen.getByRole('button', { name: 'Delete list: Summer Books' })).toHaveClass('bg-destructive')
  })



  it('deletes a public list after confirmation', async () => {
    const deleteManagedList = vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true }))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderScreen(createRepository(vi.fn(async () => publicLists), deleteManagedList))

    fireEvent.click(await screen.findByRole('button', { name: 'Delete list: Summer Books' }))

    expect(confirm).toHaveBeenCalledWith('Delete this public list? This also removes every item saved inside it.')
    await waitFor(() => {
      expect(deleteManagedList).toHaveBeenCalledWith('user-private', 'list-summer-books')
    })
    expect(await screen.findByText('Public list deleted.')).toBeInTheDocument()
    expect(screen.queryByText('Summer Books')).not.toBeInTheDocument()
  })

  it('keeps the public list when delete confirmation is cancelled', async () => {
    const deleteManagedList = vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true }))
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderScreen(createRepository(vi.fn(async () => publicLists), deleteManagedList))

    fireEvent.click(await screen.findByRole('button', { name: 'Delete list: Summer Books' }))

    expect(deleteManagedList).not.toHaveBeenCalled()
    expect(screen.getByText('Summer Books')).toBeInTheDocument()
  })

  it('does not expose out-of-scope management actions', async () => {
    renderScreen(createRepository(vi.fn(async () => publicLists)))

    expect(await screen.findByText('Summer Books')).toBeInTheDocument()
    for (const name of [/compose|composer/i, /import|copy/i, /comment|like|follow|share/i, /draft|unpublish/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: /import|copy|draft|unpublish|delete/i })).not.toBeInTheDocument()
  })
})
