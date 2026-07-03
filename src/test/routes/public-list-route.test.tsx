import { render, screen, within } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import { PublicListPage } from '@/features/items/public-list-page'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { loadPublicListRoute } from '@/routes/u.$username.lista.$slug'

function TestRoot() {
  return <LocaleProvider initialLocale="en"><Outlet /></LocaleProvider>
}

const rootRoute = createRootRoute({ component: TestRoot })

let testRepository: PublicListRepository

const publicListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/u/$username/lista/$slug', loader: ({ params }) => loadPublicListRoute(params, testRepository), component: TestPublicListRoute })

const routeTree = rootRoute.addChildren([publicListRoute])

function TestPublicListRoute() {
  const list = publicListRoute.useLoaderData()

  return <PublicListPage list={list} />
}

async function renderPublicListRoute(pathname: string, lists: PublicList[] = [createPublicList()]) {
  testRepository = {
    getByOwnerAndSlug: vi.fn(async (username, slug) => lists.find((list) => list.ownerNamespace === username && list.slug === slug) ?? null),
    listMine: vi.fn(async () => []),
    publishList: vi.fn(),
  }
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [pathname] }) })

  await router.load()
  render(<RouterProvider router={router} />)

  return { repository: testRepository, router }
}

describe('public list route', () => {
  it('renders /u/ana/lista/summer-books through an unauthenticated public lookup', async () => {
    const { repository, router } = await renderPublicListRoute('/u/ana/lista/summer-books')

    expect(router.state.location.pathname).toBe('/u/ana/lista/summer-books')
    expect(repository.getByOwnerAndSlug).toHaveBeenCalledWith('ana', 'summer-books')
    expect(await screen.findByRole('heading', { level: 1, name: 'Summer Books' })).toBeInTheDocument()
    expect(screen.getByText('Published by')).toBeInTheDocument()
    expect(screen.getByText('ana')).toBeInTheDocument()
    expect(screen.getByText('Books for the summer break.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ana public avatar' })).toHaveAttribute('src', 'https://cdn.example.com/avatar.webp')
  })

  it('shows a not-found state when no public list matches the username and slug', async () => {
    await renderPublicListRoute('/u/ana/lista/missing-list', [])

    expect(await screen.findByRole('heading', { level: 1, name: 'Public list not found' })).toBeInTheDocument()
    expect(screen.getByText('This published list may not exist, may be private, or may have moved.')).toBeInTheDocument()
    expect(screen.queryByText('ana.private@example.com')).not.toBeInTheDocument()
  })

  it('renders public items read-only and omits out-of-scope actions', async () => {
    await renderPublicListRoute('/u/ana/lista/summer-books')

    expect(await screen.findByRole('heading', { level: 3, name: 'Refactoring' })).toBeInTheDocument()
    expect(screen.getByText('Public note.')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Tags' })).getByText('craft')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Refactoring cover' })).toHaveAttribute('src', 'https://images.example.com/refactoring.jpg')

    for (const action of ['import', 'copy', 'edit', 'comment', 'like', 'follow', 'collaborate']) {
      expect(screen.queryByRole('button', { name: new RegExp(action, 'i') })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: new RegExp(action, 'i') })).not.toBeInTheDocument()
    }
  })

  it('renders a gradient initial fallback when the owner has no avatar', async () => {
    await renderPublicListRoute('/u/sam/lista/weekend-picks', [createPublicList({ owner: { avatarUrl: null, displayName: 'Sam', initial: 'S' }, ownerNamespace: 'sam', slug: 'weekend-picks', title: 'Weekend Picks' })])

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
