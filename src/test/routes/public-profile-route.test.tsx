import { render, screen, within } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import type { PublicUserProfileRepository } from '@/features/auth/public-user-profile-repository'
import type { PublicOwnerProfile } from '@/features/items/public-list-repository'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { PublicProfilePage } from '@/features/items/public-profile-page'
import { LocaleProvider } from '@/i18n/locale-provider'
import { loadPublicProfileRoute } from '@/routes/u.$username.index'

function TestRoot() {
  return <LocaleProvider initialLocale="en"><Outlet /></LocaleProvider>
}

const rootRoute = createRootRoute({ component: TestRoot })

let testRepository: PublicListRepository
let testPublicUserProfileRepository: PublicUserProfileRepository

const publicProfileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/u/$username', loader: ({ params }) => loadPublicProfileRoute(params, testRepository, testPublicUserProfileRepository), component: TestPublicProfileRoute })
const routeTree = rootRoute.addChildren([publicProfileRoute])

function TestPublicProfileRoute() {
  const profile = publicProfileRoute.useLoaderData()

  return <PublicProfilePage profile={profile ?? null} />
}

async function renderPublicProfileRoute(pathname: string, profile: PublicOwnerProfile | null = createPublicOwnerProfile()) {
  testRepository = {
    createManagedList: vi.fn(),
    deleteManagedList: vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true })),
    getByOwnerAndSlug: vi.fn(async () => null),
    getManagedList: vi.fn(),
    listByOwner: vi.fn(async (username) => profile && profile.ownerNamespace === username ? profile : null),
    listMine: vi.fn(async () => []),
    publishList: vi.fn(),
    updateManagedList: vi.fn(),
  }
  testPublicUserProfileRepository = {
    getByUsername: vi.fn(async (username) => profile && profile.ownerNamespace === username
      ? {
          owner: {
            avatarUrl: 'https://cdn.example.com/current-avatar.webp',
            displayName: profile.owner.displayName,
            initial: profile.owner.initial,
          },
          ownerNamespace: profile.ownerNamespace,
        }
      : null),
  }
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [pathname] }) })

  await router.load()
  render(<RouterProvider router={router} />)

  return { publicUserProfileRepository: testPublicUserProfileRepository, repository: testRepository, router }
}

describe('public profile route', () => {
  it('renders /u/ana with the owner profile and public lists', async () => {
    const { publicUserProfileRepository, repository, router } = await renderPublicProfileRoute('/u/ana')

    expect(router.state.location.pathname).toBe('/u/ana')
    expect(repository.listByOwner).toHaveBeenCalledWith('ana')
    expect(publicUserProfileRepository.getByUsername).toHaveBeenCalledWith('ana')
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana' })).toBeInTheDocument()
    expect(screen.queryByText('@ana')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ana public profile avatar' })).toHaveAttribute('src', 'https://cdn.example.com/current-avatar.webp')
    expect(screen.getByRole('heading', { level: 2, name: 'Public lists' })).toHaveClass('sr-only')

    const articles = screen.getAllByRole('article')

    expect(within(articles[0]).getByText('Summer Books')).toBeInTheDocument()
    expect(within(articles[0]).getByText('Books for the summer break.')).toBeInTheDocument()
    expect(within(articles[0]).getByText('July 03, 2026')).toBeInTheDocument()
    expect(within(articles[0]).getByRole('link', { name: 'Open public list: Summer Books' })).toHaveAttribute('href', '/u/ana/summer-books')
    expect(within(articles[0]).getByRole('link', { name: 'Open public list: Summer Books' })).toHaveAttribute('title', 'Open Summer Books')
    expect(screen.getByText('Weekend Movies')).toBeInTheDocument()
  })

  it('shows a not-found state when the owner has no public profile lists', async () => {
    await renderPublicProfileRoute('/u/missing', null)

    expect(await screen.findByRole('heading', { level: 1, name: 'Public profile not found' })).toBeInTheDocument()
    expect(screen.getAllByText('This user has no public lists yet, or the profile may have moved.').length).toBeGreaterThan(0)
  })
})

function createPublicOwnerProfile(): PublicOwnerProfile {
  return {
    lists: [
      {
        id: 'list-1',
        owner: { avatarUrl: 'https://cdn.example.com/avatar.webp', displayName: 'Ana', initial: 'A' },
        ownerNamespace: 'ana',
        slug: 'summer-books',
        title: 'Summer Books',
        listDate: '2026-07-03',
        description: 'Books for the summer break.',
        publishedAt: '2026-07-03T10:00:00.000Z',
      },
      {
        id: 'list-2',
        owner: { avatarUrl: 'https://cdn.example.com/avatar.webp', displayName: 'Ana', initial: 'A' },
        ownerNamespace: 'ana',
        slug: 'weekend-movies',
        title: 'Weekend Movies',
        listDate: '2026-07-04',
        publishedAt: '2026-07-04T10:00:00.000Z',
      },
    ],
    owner: { avatarUrl: 'https://cdn.example.com/avatar.webp', displayName: 'Ana', initial: 'A' },
    ownerNamespace: 'ana',
  }
}
