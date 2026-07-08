import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicUserProfileRepository } from '@/features/auth/public-user-profile-repository'
import { publicListDisplayPreferenceStorageKey } from '@/features/items/dashboard-display-preference'
import { PublicListPage } from '@/features/items/public-list-page'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'
import { loadPublicListRoute } from '@/routes/u.$username.$slug'

const publicListRouteTestState = vi.hoisted(() => ({
  authContext: {
    client: null as null | { collection: (name: string) => unknown },
    isAuthenticated: false,
    user: null as null | { id: string },
  },
  createItem: vi.fn(),
  listItems: vi.fn(),
  publicListItemSaveCreate: vi.fn(),
  publicListItemSaveGetFullList: vi.fn(),
}))

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => publicListRouteTestState.authContext,
}))

const testInterestRepository = vi.hoisted(() => ({
  createItem: publicListRouteTestState.createItem,
  listItems: publicListRouteTestState.listItems,
}))

vi.mock('@/features/items/app-interest-repository', () => ({
  useAppInterestRepository: () => testInterestRepository,
}))

function TestRoot() {
  return <LocaleProvider initialLocale="en"><Outlet /></LocaleProvider>
}

const rootRoute = createRootRoute({ component: TestRoot })

let testRepository: PublicListRepository
let testPublicUserProfileRepository: PublicUserProfileRepository

const publicListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/u/$username/$slug', loader: ({ params }) => loadPublicListRoute(params, testRepository, testPublicUserProfileRepository), component: TestPublicListRoute })

const routeTree = rootRoute.addChildren([publicListRoute])

function TestPublicListRoute() {
  const list = publicListRoute.useLoaderData()

  return <PublicListPage list={list} />
}

async function renderPublicListRoute(pathname: string, lists: PublicList[] = [createPublicList()]) {
  testRepository = {
    createManagedList: vi.fn(),
    deleteManagedList: vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true })),
    getByOwnerAndSlug: vi.fn(async (username, slug) => lists.find((list) => list.ownerNamespace === username && list.slug === slug) ?? null),
    getManagedList: vi.fn(),
    listByOwner: vi.fn(async () => null),
    listMine: vi.fn(async () => []),
    publishList: vi.fn(),
    updateManagedList: vi.fn(),
  }
  testPublicUserProfileRepository = {
    getByUsername: vi.fn(async (username) => {
      const list = lists.find((candidate) => candidate.ownerNamespace === username)

      if (!list) {
        return null
      }

      return {
        owner: {
          avatarUrl: username === 'ana' ? 'https://cdn.example.com/current-avatar.webp' : list.owner.avatarUrl,
          displayName: list.owner.displayName,
          initial: list.owner.initial,
        },
        ownerNamespace: list.ownerNamespace,
      }
    }),
  }
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [pathname] }) })

  await router.load()
  render(<RouterProvider router={router} />)

  return { publicUserProfileRepository: testPublicUserProfileRepository, repository: testRepository, router }
}

describe('public list route', () => {
  beforeEach(() => {
    installMockLocalStorage()
    window.localStorage.clear()
    publicListRouteTestState.authContext = { client: null, isAuthenticated: false, user: null }
    publicListRouteTestState.createItem.mockReset()
    publicListRouteTestState.listItems.mockReset()
    publicListRouteTestState.listItems.mockResolvedValue([])
    publicListRouteTestState.publicListItemSaveCreate.mockReset()
    publicListRouteTestState.publicListItemSaveGetFullList.mockReset()
    publicListRouteTestState.publicListItemSaveGetFullList.mockResolvedValue([])
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders /u/ana/summer-books through an unauthenticated public lookup', async () => {
    const { publicUserProfileRepository, repository, router } = await renderPublicListRoute('/u/ana/summer-books')

    expect(router.state.location.pathname).toBe('/u/ana/summer-books')
    expect(repository.getByOwnerAndSlug).toHaveBeenCalledWith('ana', 'summer-books')
    expect(publicUserProfileRepository.getByUsername).toHaveBeenCalledWith('ana')
    expect(await screen.findByRole('heading', { level: 1, name: 'Summer Books' })).toBeInTheDocument()
    expect(screen.getAllByText('Makimono').length).toBeGreaterThanOrEqual(1)
    expect(within(screen.getAllByRole('banner')[0]).queryByText('makimono.io')).not.toBeInTheDocument()
    expect(screen.queryByText('Published by')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View ana public profile' })).toHaveAttribute('href', '/u/ana')
    expect(screen.getByText('Jul 3, 2026')).toBeInTheDocument()
    expect(screen.getByText('Books for the summer break.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ana public avatar' })).toHaveAttribute('src', 'https://cdn.example.com/current-avatar.webp')
    expect(screen.getByRole('img', { name: 'ana public avatar' })).toHaveClass('h-[25px]', 'w-[25px]')
    const coverAddAction = screen.getAllByRole('link', { name: 'Register to add it to your interests' })[0]

    expect(coverAddAction).toHaveAttribute('href', '/?auth=register')
    expect(coverAddAction).toHaveTextContent('Register to add it to your interests')
  })

  it('shows a not-found state when no public list matches the username and slug', async () => {
    await renderPublicListRoute('/u/ana/missing-list', [])

    expect(await screen.findByRole('heading', { level: 1, name: 'Public list not found' })).toBeInTheDocument()
    expect(screen.getByText('This published list may not exist, may be private, or may have moved.')).toBeInTheDocument()
    expect(screen.queryByText('ana.private@example.com')).not.toBeInTheDocument()
  })

  it('renders public items read-only and omits out-of-scope actions', async () => {
    await renderPublicListRoute('/u/ana/summer-books')

    expect(screen.getByRole('radiogroup', { name: 'Dashboard display' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 3, name: 'Refactoring' })).toBeInTheDocument()
    expect(screen.getByText('Public note.')).toBeInTheDocument()
    expect(screen.getByText('craft')).toHaveClass('font-mono')
    expect(screen.getByText('Books')).toHaveClass('border')
    expect(screen.getByTestId('public-list-card-cover')).toBeInTheDocument()

    for (const action of ['import', 'copy', 'edit', 'comment', 'like', 'follow', 'collaborate']) {
      expect(screen.queryByRole('button', { name: new RegExp(action, 'i') })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: new RegExp(action, 'i') })).not.toBeInTheDocument()
    }
  })

  it('applies the selected display mode to the public list items', async () => {
    await renderPublicListRoute('/u/ana/summer-books')

    const displayControls = screen.getByRole('radiogroup', { name: 'Dashboard display' })
    const listRadio = within(displayControls).getByRole('radio', { name: 'List' })
    const cardsRadio = within(displayControls).getByRole('radio', { name: 'Cards' })
    const coversRadio = within(displayControls).getByRole('radio', { name: 'Covers' })

    expect(cardsRadio).toBeChecked()
    expect(screen.getByText('Public note.')).toBeInTheDocument()

    fireEvent.click(coversRadio)

    expect(coversRadio).toBeChecked()
    expect(screen.queryByText('Public note.')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Refactoring cover' })).toHaveAttribute('src', 'https://images.example.com/refactoring.jpg')

    fireEvent.click(listRadio)

    expect(listRadio).toBeChecked()
    expect(screen.queryByText('Public note.')).not.toBeInTheDocument()
    expect(screen.getByText('Refactoring')).toHaveClass('text-accent-yellow')
    expect(screen.getByRole('heading', { level: 3, name: 'Books' })).toHaveClass('text-accent-yellow')
    expect(screen.getByRole('list', { name: 'Books List items' })).toHaveClass('xl:grid-cols-3')
    expect(screen.getAllByText('Books')).toHaveLength(1)
    expect(screen.queryByText('This public list is empty')).not.toBeInTheDocument()

    fireEvent.click(cardsRadio)

    expect(cardsRadio).toBeChecked()
    expect(screen.getByText('Public note.')).toBeInTheDocument()
    expect(screen.getByText('craft')).toHaveClass('font-mono')
  })

  it('persists the public list display preference separately from the dashboard preference', async () => {
    window.localStorage.setItem(publicListDisplayPreferenceStorageKey, 'covers')
    window.localStorage.setItem('meinteresa.dashboardDisplayPreference', 'list')

    await renderPublicListRoute('/u/ana/summer-books')

    const displayControls = screen.getByRole('radiogroup', { name: 'Dashboard display' })
    const coversRadio = within(displayControls).getByRole('radio', { name: 'Covers' })
    const cardsRadio = within(displayControls).getByRole('radio', { name: 'Cards' })

    await waitFor(() => expect(coversRadio).toBeChecked())

    fireEvent.click(cardsRadio)

    expect(cardsRadio).toBeChecked()
    expect(window.localStorage.getItem(publicListDisplayPreferenceStorageKey)).toBe('cards')
    expect(window.localStorage.getItem('meinteresa.dashboardDisplayPreference')).toBe('list')
  })

  it('keeps the dashboard save successful when public-list analytics recording fails', async () => {
    publicListRouteTestState.createItem.mockResolvedValue({})
    publicListRouteTestState.publicListItemSaveCreate.mockRejectedValue(new Error('Failed to create record.'))
    publicListRouteTestState.authContext = {
      client: {
        collection: vi.fn(() => ({
          create: publicListRouteTestState.publicListItemSaveCreate,
          getFullList: publicListRouteTestState.publicListItemSaveGetFullList,
        })),
      },
      isAuthenticated: true,
      user: { id: 'user-reader' },
    }

    await renderPublicListRoute('/u/ana/summer-books')

    fireEvent.click(await screen.findByRole('button', { name: 'Add: Refactoring' }))

    await waitFor(() => expect(publicListRouteTestState.createItem).toHaveBeenCalledWith({
      category: 'books',
      coverImageUrl: 'https://images.example.com/refactoring.jpg',
      coverMatchedTitle: 'Refactoring',
      coverProvider: 'open-library',
      notes: 'Public note.',
      tags: ['craft'],
      title: 'Refactoring',
    }))
    expect(publicListRouteTestState.publicListItemSaveCreate).toHaveBeenCalledWith({
      itemId: 'item-1',
      publicList: 'public-list-1',
      savedBy: 'user-reader',
    })
    expect(await screen.findByText('Added to your interests.')).toBeInTheDocument()
    expect(screen.queryByText('We could not add that interest. Try again in a moment.')).not.toBeInTheDocument()
  })

  it('marks current-user private interests as already added in the public list', async () => {
    publicListRouteTestState.authContext = createAuthenticatedRouteContext()
    publicListRouteTestState.listItems.mockResolvedValue([{
      category: 'books',
      createdAt: '2026-07-04T10:00:00.000Z',
      id: 'private-item-1',
      status: 'pending',
      tags: [],
      title: ' Refactoring ',
    }])

    await renderPublicListRoute('/u/ana/summer-books')

    const savedAction = await screen.findByRole('button', { name: 'Added to your interests: Refactoring' })

    expect(savedAction).toBeDisabled()
    expect(publicListRouteTestState.listItems).toHaveBeenCalledWith()
    expect(publicListRouteTestState.publicListItemSaveGetFullList).not.toHaveBeenCalled()
  })

  it('skips already-added items when exporting the full public list', async () => {
    publicListRouteTestState.authContext = createAuthenticatedRouteContext()
    publicListRouteTestState.createItem.mockResolvedValue({})
    publicListRouteTestState.listItems.mockResolvedValue([{
      category: 'books',
      createdAt: '2026-07-04T10:00:00.000Z',
      id: 'private-item-1',
      status: 'pending',
      tags: [],
      title: ' Refactoring ',
    }])
    const list = createPublicList({
      items: [
        { id: 'item-1', category: 'books', title: 'Refactoring', notes: 'Public note.', tags: ['craft'], coverImageUrl: 'https://images.example.com/refactoring.jpg', coverProvider: 'open-library', coverMatchedTitle: 'Refactoring' },
        { id: 'item-2', category: 'movies', title: 'Dune', notes: 'Spice classic.', tags: ['sci-fi'] },
      ],
    })

    await renderPublicListRoute('/u/ana/summer-books', [list])

    await screen.findByRole('button', { name: 'Added to your interests: Refactoring' })
    fireEvent.click(screen.getByRole('button', { name: 'Export full list' }))

    await waitFor(() => expect(publicListRouteTestState.createItem).toHaveBeenCalledTimes(1))
    expect(publicListRouteTestState.createItem).toHaveBeenCalledWith({
      category: 'movies',
      notes: 'Spice classic.',
      tags: ['sci-fi'],
      title: 'Dune',
    })
    expect(publicListRouteTestState.createItem).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Refactoring' }))
    expect(publicListRouteTestState.publicListItemSaveCreate).toHaveBeenCalledWith({
      itemId: 'item-2',
      publicList: 'public-list-1',
      savedBy: 'user-reader',
    })
  })

  it('does not duplicate already-created items when retrying a partial full-list export failure', async () => {
    publicListRouteTestState.authContext = createAuthenticatedRouteContext()
    publicListRouteTestState.createItem
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Temporary create failure.'))
      .mockResolvedValueOnce({})
    const list = createPublicList({
      items: [
        { id: 'item-1', category: 'books', title: 'Refactoring', notes: 'Public note.', tags: ['craft'], coverImageUrl: 'https://images.example.com/refactoring.jpg', coverProvider: 'open-library', coverMatchedTitle: 'Refactoring' },
        { id: 'item-2', category: 'movies', title: 'Dune', notes: 'Spice classic.', tags: ['sci-fi'] },
      ],
    })

    await renderPublicListRoute('/u/ana/summer-books', [list])

    fireEvent.click(await screen.findByRole('button', { name: 'Export full list' }))

    expect(await screen.findByText('We could not add that interest. Try again in a moment.')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Added to your interests: Refactoring' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Export full list' }))

    await waitFor(() => expect(publicListRouteTestState.createItem).toHaveBeenCalledTimes(3))
    expect(publicListRouteTestState.createItem).toHaveBeenNthCalledWith(1, expect.objectContaining({ title: 'Refactoring' }))
    expect(publicListRouteTestState.createItem).toHaveBeenNthCalledWith(2, expect.objectContaining({ title: 'Dune' }))
    expect(publicListRouteTestState.createItem).toHaveBeenNthCalledWith(3, expect.objectContaining({ title: 'Dune' }))
    expect(publicListRouteTestState.createItem).not.toHaveBeenNthCalledWith(3, expect.objectContaining({ title: 'Refactoring' }))
  })

  it('disables full-list export when every public item is already added', async () => {
    publicListRouteTestState.authContext = createAuthenticatedRouteContext()
    publicListRouteTestState.listItems.mockResolvedValue([{
      category: 'books',
      createdAt: '2026-07-04T10:00:00.000Z',
      id: 'private-item-1',
      status: 'pending',
      tags: [],
      title: 'Refactoring',
    }])

    await renderPublicListRoute('/u/ana/summer-books')

    const saveAllAction = await screen.findByRole('button', { name: 'All list items were added to your interests.' })

    expect(saveAllAction).toBeDisabled()
    fireEvent.click(saveAllAction)
    expect(publicListRouteTestState.createItem).not.toHaveBeenCalled()
    expect(publicListRouteTestState.publicListItemSaveCreate).not.toHaveBeenCalled()
  })

  it('renders a gradient initial fallback when the owner has no avatar', async () => {
    await renderPublicListRoute('/u/sam/weekend-picks', [createPublicList({ owner: { avatarUrl: null, displayName: 'Sam', initial: 'S' }, ownerNamespace: 'sam', slug: 'weekend-picks', title: 'Weekend Picks' })])

    const fallback = await screen.findByRole('img', { name: 'Sam public avatar fallback' })

    expect(fallback).toHaveTextContent('S')
    expect(fallback).toHaveClass('bg-gradient-to-br')
  })
})

function createAuthenticatedRouteContext() {
  return {
    client: {
      collection: vi.fn(() => ({
        create: publicListRouteTestState.publicListItemSaveCreate,
        getFullList: publicListRouteTestState.publicListItemSaveGetFullList,
      })),
    },
    isAuthenticated: true,
    user: { id: 'user-reader' },
  }
}

function createPublicList(overrides: Partial<PublicList> = {}): PublicList {
  return {
    id: 'public-list-1',
    owner: { avatarUrl: 'https://cdn.example.com/avatar.webp', displayName: 'ana', initial: 'A' },
    ownerNamespace: 'ana',
    slug: 'summer-books',
    title: 'Summer Books',
    listDate: '2026-07-03',
    description: 'Books for the summer break.',
    items: [{ id: 'item-1', category: 'books', title: 'Refactoring', notes: 'Public note.', tags: ['craft'], coverImageUrl: 'https://images.example.com/refactoring.jpg', coverProvider: 'open-library', coverMatchedTitle: 'Refactoring' }],
    publishedAt: '2026-07-03T10:00:00.000Z',
    ...overrides,
  }
}
