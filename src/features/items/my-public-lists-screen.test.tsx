import { render, screen } from '@testing-library/react'
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

function createRepository(listMine: PublicListRepository['listMine']): PublicListRepository {
  return {
    getByOwnerAndSlug: vi.fn(async () => null),
    listMine,
    publishList: vi.fn<PublicListRepository['publishList']>(async () => ({ error: { type: 'unauthenticated' }, ok: false })),
  }
}

function renderScreen(repository: PublicListRepository) {
  render(
    <LocaleProvider initialLocale={'en'}>
      <MyPublicListsScreen repository={repository} />
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

    expect(screen.getByRole('heading', { level: 1, name: 'My public lists' })).toBeInTheDocument()
    expect(screen.getByText('Loading your public lists…')).toBeInTheDocument()

    deferred.resolve([])

    expect(await screen.findByText('No public lists published yet')).toBeInTheDocument()
  })

  it('shows an empty state when no published lists are returned', async () => {
    renderScreen(createRepository(vi.fn(async () => [])))

    expect(await screen.findByText('No public lists published yet')).toBeInTheDocument()
    expect(screen.getByText('Publish a list when you are ready to make it visible from your public profile.')).toBeInTheDocument()
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
    expect(screen.getByText('/u/mariano/lista/summer-books')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open public URL' })).toHaveAttribute('href', '/u/mariano/lista/summer-books')
  })

  it('does not expose out-of-scope management actions', async () => {
    renderScreen(createRepository(vi.fn(async () => publicLists)))

    expect(await screen.findByText('Summer Books')).toBeInTheDocument()
    for (const name of [/compose|composer|create list/i, /import|copy/i, /edit/i, /comment|like|follow|share/i, /draft|unpublish|delete/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: /import|copy|edit|draft|unpublish|delete/i })).not.toBeInTheDocument()
  })
})
