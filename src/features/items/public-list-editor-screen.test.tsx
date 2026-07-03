import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PublicListEditorScreen } from '@/features/items/public-list-editor-screen'
import { createInMemoryPublicListRepository, type PublicListRepository } from '@/features/items/public-list-repository'
import type { PublicList } from '@/features/items/public-list-types'
import { createMockInterestRepository } from '@/features/items/mock-repository'
import type { InterestItem, InterestRepository } from '@/features/items/types'
import { LocaleProvider } from '@/i18n/locale-provider'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

const ownerUser = {
  email: 'owner@example.com',
  id: 'user-owner',
  username: 'mariano',
} satisfies PocketBaseAuthRecord

function renderEditorScreen(options: {
  interestRepository?: InterestRepository
  list?: PublicList
  listId?: string
  publicListRepository?: PublicListRepository
  user?: PocketBaseAuthRecord | null
} = {}) {
  const list = options.list ?? createManagedList()
  const publicListRepository = options.publicListRepository
    ?? createInMemoryPublicListRepository([list], { ownerId: ownerUser.id })
  const interestRepository = options.interestRepository
    ?? createMockInterestRepository(createCurrentUserItems())

  render(
    <LocaleProvider initialLocale={'en'}>
      <PublicListEditorScreen
        authenticatedUser={options.user ?? ownerUser}
        interestRepository={interestRepository}
        listId={options.listId ?? list.id}
        publicListRepository={publicListRepository}
      />
    </LocaleProvider>,
  )

  return { interestRepository, publicListRepository }
}

describe('PublicListEditorScreen', () => {
  it('denies editor access when the authenticated user is not the list owner', async () => {
    const repository = createInMemoryPublicListRepository([
      { ...createManagedList(), ownerId: 'other-user' },
    ], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    expect(await screen.findByRole('alert')).toHaveTextContent('Public list editor unavailable')
    expect(screen.queryByRole('button', { name: /Add to list/i })).not.toBeInTheDocument()
    expect(updateManagedList).not.toHaveBeenCalled()
  })

  it('shows only eligible interests from the current private repository', async () => {
    renderEditorScreen()

    expect(await screen.findByRole('heading', { level: 1, name: 'Summer Books' })).toBeInTheDocument()

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })
    const eligibleItems = screen.getByRole('list', { name: 'Eligible interests from your account' })

    expect(within(savedItems).getByText('Refactoring')).toBeInTheDocument()
    expect(within(eligibleItems).getByText('Arrival')).toBeInTheDocument()
    expect(within(eligibleItems).queryByText('Refactoring')).not.toBeInTheDocument()
    expect(screen.queryByText('Deleted Draft')).not.toBeInTheDocument()
    expect(screen.queryByText('Other User Public Pick')).not.toBeInTheDocument()
  })

  it('persists an added interest and renders the saved update returned by the repository', async () => {
    const repository = createInMemoryPublicListRepository([createManagedList()], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Add to list: Arrival' }))

    expect(await screen.findByText('Saved. The public list now shows the added interest.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        authenticatedOwnerId: ownerUser.id,
        id: 'list-summer-books',
        items: expect.arrayContaining([expect.objectContaining({ id: 'movie-arrival', title: 'Arrival' })]),
      }))
    })

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Arrival')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to list: Arrival' })).not.toBeInTheDocument()
  })

  it('creates a list-only item through the public list repository without creating a private interest', async () => {
    const repository = createInMemoryPublicListRepository([createManagedList()], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')
    const interestRepository = createMockInterestRepository(createCurrentUserItems())
    const createItem = vi.spyOn(interestRepository, 'createItem')

    renderEditorScreen({ interestRepository, publicListRepository: repository })

    await screen.findByRole('heading', { level: 1, name: 'Summer Books' })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'music' } })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Kind of Blue' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add list-only item' }))

    expect(await screen.findByText('Saved. The public list now shows the list-only item.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        authenticatedOwnerId: ownerUser.id,
        id: 'list-summer-books',
        items: expect.arrayContaining([
          expect.objectContaining({ category: 'music', id: 'public-list-only-music-kind-of-blue', tags: [], title: 'Kind of Blue' }),
        ]),
      }))
    })

    expect(createItem).not.toHaveBeenCalled()

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Kind of Blue')).toBeInTheDocument()
  })

  it('preserves the prior committed membership when add-interest persistence fails', async () => {
    const currentList = createManagedList()
    const repository: PublicListRepository = {
      createManagedList: vi.fn(),
      getByOwnerAndSlug: vi.fn(async () => null),
      getManagedList: vi.fn(async () => currentList),
      listMine: vi.fn(async () => []),
      publishList: vi.fn(),
      updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
    }

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Add to list: Arrival' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that interest. The public list was left unchanged.')

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })
    const eligibleItems = screen.getByRole('list', { name: 'Eligible interests from your account' })

    expect(within(savedItems).getByText('Refactoring')).toBeInTheDocument()
    expect(within(savedItems).queryByText('Arrival')).not.toBeInTheDocument()
    expect(within(eligibleItems).getByText('Arrival')).toBeInTheDocument()
  })

  it('preserves the prior committed membership when list-only item persistence fails', async () => {
    const currentList = createManagedList()
    const repository: PublicListRepository = {
      createManagedList: vi.fn(),
      getByOwnerAndSlug: vi.fn(async () => null),
      getManagedList: vi.fn(async () => currentList),
      listMine: vi.fn(async () => []),
      publishList: vi.fn(),
      updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
    }

    renderEditorScreen({ publicListRepository: repository })

    await screen.findByRole('heading', { level: 1, name: 'Summer Books' })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Dune' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add list-only item' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that list-only item. The public list was left unchanged.')

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Refactoring')).toBeInTheDocument()
    expect(within(savedItems).queryByText('Dune')).not.toBeInTheDocument()
  })
})

function createManagedList(overrides: Partial<PublicList> = {}): PublicList & { ownerId: string } {
  return {
    id: 'list-summer-books',
    owner: { avatarUrl: null, displayName: 'Mariano', initial: 'M' },
    ownerId: ownerUser.id,
    ownerNamespace: 'mariano',
    slug: 'summer-books',
    title: 'Summer Books',
    listDate: '2026-07-03',
    description: 'Books for the summer break.',
    items: [{ category: 'books', id: 'book-refactoring', notes: 'Public note.', tags: ['craft'], title: 'Refactoring' }],
    publishedAt: '2026-07-03T10:00:00.000Z',
    ...overrides,
  }
}

function createCurrentUserItems(): InterestItem[] {
  return [
    { category: 'books', createdAt: '2026-06-01T08:00:00.000Z', id: 'book-refactoring', notes: 'Private note.', status: 'pending', tags: ['craft'], title: 'Refactoring' },
    { category: 'movies', createdAt: '2026-06-02T08:00:00.000Z', id: 'movie-arrival', notes: 'Watch later.', status: 'pending', tags: ['sci-fi'], title: 'Arrival' },
    { category: 'games', createdAt: '2026-06-03T08:00:00.000Z', deletedAt: '2026-06-04T08:00:00.000Z', id: 'game-deleted-draft', status: 'pending', tags: [], title: 'Deleted Draft' },
  ]
}
