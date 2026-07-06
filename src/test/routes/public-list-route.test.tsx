import { fireEvent, render, screen, within } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import type { PublicUserProfileRepository } from '@/features/auth/public-user-profile-repository'
import { PublicListPage } from '@/features/items/public-list-page'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { loadPublicListRoute } from '@/routes/u.$username.$slug'

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
    expect(screen.getAllByRole('link', { name: 'Register to add it to your interests' })[0]).toHaveAttribute('href', '/?auth=register')
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
    expect(screen.queryByText('Public note.')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument()
    expect(screen.queryByText('craft')).not.toBeInTheDocument()
    expect(screen.getByText('Books')).toHaveClass('border')
    expect(screen.getByRole('img', { name: 'Refactoring cover' })).toHaveAttribute('src', 'https://images.example.com/refactoring.jpg')

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

    expect(within(displayControls).getByRole('radio', { name: 'Covers' })).toBeChecked()
    expect(screen.queryByText('Public note.')).not.toBeInTheDocument()

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

  it('renders a gradient initial fallback when the owner has no avatar', async () => {
    await renderPublicListRoute('/u/sam/weekend-picks', [createPublicList({ owner: { avatarUrl: null, displayName: 'Sam', initial: 'S' }, ownerNamespace: 'sam', slug: 'weekend-picks', title: 'Weekend Picks' })])

    const fallback = await screen.findByRole('img', { name: 'Sam public avatar fallback' })

    expect(fallback).toHaveTextContent('S')
    expect(fallback).toHaveClass('bg-gradient-to-br')
  })
})

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
