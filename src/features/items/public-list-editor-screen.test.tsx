import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PublicListEditorScreen } from '@/features/items/public-list-editor-screen'
import type { InterestCoverResolver } from '@/features/items/cover-metadata'
import type { PublicListItemSaveRepository } from '@/features/items/public-list-item-save-repository'
import { createInMemoryPublicListRepository, type PublicListRepository } from '@/features/items/public-list-repository'
import type { PublicList } from '@/features/items/public-list-types'
import { LocaleProvider } from '@/i18n/locale-provider'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

const ownerUser = {
  email: 'owner@example.com',
  id: 'user-owner',
  username: 'mariano',
} satisfies PocketBaseAuthRecord

function renderEditorScreen(options: {
  coverResolver?: InterestCoverResolver
  list?: PublicList
  listId?: string
  publicListItemSaveRepository?: PublicListItemSaveRepository
  publicListRepository?: PublicListRepository
  user?: PocketBaseAuthRecord | null
} = {}) {
  const list = options.list ?? createManagedList()
  const publicListRepository = options.publicListRepository
    ?? createInMemoryPublicListRepository([list], { ownerId: ownerUser.id })

  render(
    <LocaleProvider initialLocale={'en'}>
      <PublicListEditorScreen
        authenticatedUser={options.user ?? ownerUser}
        coverResolver={options.coverResolver}
        listId={options.listId ?? list.id}
        publicListItemSaveRepository={options.publicListItemSaveRepository}
        publicListRepository={publicListRepository}
      />
    </LocaleProvider>,
  )

  return { publicListRepository }
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

  it('renders a simplified editor without dashboard-saved item picking', async () => {
    renderEditorScreen()

    expect(await screen.findByRole('heading', { level: 1, name: 'Summer Books' })).toBeInTheDocument()

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Refactoring')).toBeInTheDocument()
    expect(within(savedItems).queryByText('Public note.')).not.toBeInTheDocument()
    expect(within(savedItems).getByRole('button', { name: 'Edit interest: Refactoring' })).toBeInTheDocument()
    expect(within(savedItems).getByRole('heading', { name: 'Books' })).toBeInTheDocument()
    expect(within(savedItems).getByRole('heading', { name: 'Movies' })).toBeInTheDocument()
    expect(within(savedItems).getAllByText('No interests in this category yet.').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Open public URL' })).toHaveAttribute('href', '/u/mariano/summer-books')
    expect(screen.queryByRole('list', { name: 'Eligible interests from your account' })).not.toBeInTheDocument()
    expect(screen.queryByText('Add saved interests')).not.toBeInTheDocument()
    expect(screen.queryByText('Add a rich list-only interest')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open rich composer' })).toHaveClass('size-14')
    expect(screen.queryByRole('button', { name: /Add to list:/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Deleted Draft')).not.toBeInTheDocument()
    expect(screen.queryByText('Other User Public Pick')).not.toBeInTheDocument()
  })

  it('renders saved-count badges for public list items', async () => {
    renderEditorScreen({
      publicListItemSaveRepository: {
        getItemSaveCounts: vi.fn(async () => ({ 'book-refactoring': 3 })),
        recordItemSave: vi.fn(),
      },
    })

    const savedItems = await screen.findByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('3 saves')).toBeInTheDocument()
  })

  it('creates a rich list-only snapshot through the public list repository without creating a private interest', async () => {
    const repository = createInMemoryPublicListRepository([createManagedList()], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')
    const coverResolver: InterestCoverResolver = vi.fn().mockResolvedValue({
      coverImageUrl: 'https://images.example.com/kind-of-blue.jpg',
      coverMatchedTitle: 'Kind of Blue',
      coverProvider: 'musicbrainz',
    })

    renderEditorScreen({ coverResolver, publicListRepository: repository })

    await screen.findByRole('heading', { level: 1, name: 'Summer Books' })
    fireEvent.click(screen.getByRole('button', { name: 'Open rich composer' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Music' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Kind of Blue' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: '  Listen on vinyl.  ' } })

    const tagsInput = screen.getByLabelText('Tags')

    fireEvent.change(tagsInput, { target: { value: 'jazz' } })
    fireEvent.keyDown(tagsInput, { code: 'Enter', key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Find cover' }))
    await screen.findByRole('img', { name: 'Cover preview' })
    fireEvent.click(screen.getByRole('button', { name: 'Add rich list-only item' }))

    expect(await screen.findByText('Saved. The public list now shows the rich list-only item.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        authenticatedOwnerId: ownerUser.id,
        id: 'list-summer-books',
        items: expect.arrayContaining([
          expect.objectContaining({
            category: 'music',
            coverImageUrl: 'https://images.example.com/kind-of-blue.jpg',
            coverMatchedTitle: 'Kind of Blue',
            coverProvider: 'musicbrainz',
            id: 'public-list-only-music-kind-of-blue',
            notes: 'Listen on vinyl.',
            tags: ['jazz'],
            title: 'Kind of Blue',
          }),
        ]),
      }))
    })

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Kind of Blue')).toBeInTheDocument()
  })

  it('edits a saved public-list interest through the rich drawer', async () => {
    const repository = createInMemoryPublicListRepository([createManagedList()], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Edit interest: Refactoring' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit list interest' })).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Refactoring')
    expect(screen.getByLabelText('Notes')).toHaveValue('Public note.')

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Refactoring 2nd Edition' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Updated note.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save list interest' }))

    expect(await screen.findByText('Saved. The public list now shows the edited interest.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        items: [expect.objectContaining({
          id: 'book-refactoring',
          notes: 'Updated note.',
          title: 'Refactoring 2nd Edition',
        })],
      }))
    })

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Refactoring 2nd Edition')).toBeInTheDocument()
    expect(within(savedItems).queryByText('Updated note.')).not.toBeInTheDocument()
  })

  it('persists ordering changes inside a category', async () => {
    const repository = createInMemoryPublicListRepository([
      createManagedList({
        items: [
          { category: 'books', id: 'book-refactoring', notes: 'Public note.', tags: ['craft'], title: 'Refactoring' },
          { category: 'books', id: 'book-domain-driven-design', notes: 'Blue book.', tags: ['architecture'], title: 'Domain-Driven Design' },
          { category: 'movies', id: 'movie-arrival', notes: 'Watch later.', tags: ['sci-fi'], title: 'Arrival' },
        ],
      }),
    ], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Move up: Domain-Driven Design' }))

    expect(await screen.findByText('Order updated.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        items: [
          expect.objectContaining({ id: 'book-domain-driven-design' }),
          expect.objectContaining({ id: 'book-refactoring' }),
          expect.objectContaining({ id: 'movie-arrival' }),
        ],
      }))
    })

    const booksList = screen.getByRole('list', { name: 'Books: Saved public list interests' })
    const bookHeadings = within(booksList).getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)

    expect(bookHeadings).toEqual(['Domain-Driven Design', 'Refactoring'])
  })

  it('persists drag ordering changes inside the same category', async () => {
    const repository = createInMemoryPublicListRepository([
      createManagedList({
        items: [
          { category: 'books', id: 'book-refactoring', notes: 'Public note.', tags: ['craft'], title: 'Refactoring' },
          { category: 'books', id: 'book-domain-driven-design', notes: 'Blue book.', tags: ['architecture'], title: 'Domain-Driven Design' },
          { category: 'movies', id: 'movie-arrival', notes: 'Watch later.', tags: ['sci-fi'], title: 'Arrival' },
        ],
      }),
    ], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    await screen.findByRole('heading', { level: 1, name: 'Summer Books' })

    const booksList = screen.getByRole('list', { name: 'Books: Saved public list interests' })
    const refactoringRow = within(booksList).getByText('Refactoring').closest('li')
    const domainDrivenDesignRow = within(booksList).getByText('Domain-Driven Design').closest('li')
    const dataTransfer = createDragDataTransfer()

    expect(refactoringRow).not.toBeNull()
    expect(domainDrivenDesignRow).not.toBeNull()

    fireEvent.dragStart(refactoringRow!, { dataTransfer })
    fireEvent.dragOver(domainDrivenDesignRow!, { dataTransfer })
    fireEvent.drop(domainDrivenDesignRow!, { dataTransfer })

    expect(await screen.findByText('Order updated.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        items: [
          expect.objectContaining({ id: 'book-domain-driven-design' }),
          expect.objectContaining({ id: 'book-refactoring' }),
          expect.objectContaining({ id: 'movie-arrival' }),
        ],
      }))
    })
  })

  it('removes a saved public-list snapshot', async () => {
    const repository = createInMemoryPublicListRepository([createManagedList()], { ownerId: ownerUser.id })
    const updateManagedList = vi.spyOn(repository, 'updateManagedList')

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Remove from list: Refactoring' }))

    expect(await screen.findByText('Removed. The public list no longer shows that item.')).toBeInTheDocument()

    await waitFor(() => {
      expect(updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
        authenticatedOwnerId: ownerUser.id,
        id: 'list-summer-books',
        items: [],
      }))
    })

    expect(screen.getByText('No interests saved yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to list: Refactoring' })).not.toBeInTheDocument()
  })

  it('preserves the prior committed membership when saved public-list snapshot removal fails', async () => {
    const currentList = createManagedList()
    const repository: PublicListRepository = {
      createManagedList: vi.fn(),
      deleteManagedList: vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true })),
      getByOwnerAndSlug: vi.fn(async () => null),
      getManagedList: vi.fn(async () => currentList),
      listByOwner: vi.fn(async () => null),
      listMine: vi.fn(async () => []),
      publishList: vi.fn(),
      updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
    }

    renderEditorScreen({ publicListRepository: repository })

    fireEvent.click(await screen.findByRole('button', { name: 'Remove from list: Refactoring' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not remove that item. The public list was left unchanged.')

    const savedItems = screen.getByRole('list', { name: 'Saved public list interests' })

    expect(within(savedItems).getByText('Refactoring')).toBeInTheDocument()
    expect(repository.updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
      items: [],
    }))
  })

  it('preserves the prior committed membership when rich list-only item persistence fails', async () => {
    const currentList = createManagedList()
    const repository: PublicListRepository = {
      createManagedList: vi.fn(),
      deleteManagedList: vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true })),
      getByOwnerAndSlug: vi.fn(async () => null),
      getManagedList: vi.fn(async () => currentList),
      listByOwner: vi.fn(async () => null),
      listMine: vi.fn(async () => []),
      publishList: vi.fn(),
      updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
    }

    renderEditorScreen({ publicListRepository: repository })

    await screen.findByRole('heading', { level: 1, name: 'Summer Books' })
    fireEvent.click(screen.getByRole('button', { name: 'Open rich composer' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Dune' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add rich list-only item' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that rich list-only item. The public list was left unchanged.')

    expect(screen.getByText('Refactoring')).toBeInTheDocument()
    expect(repository.updateManagedList).toHaveBeenCalledWith(expect.objectContaining({
      items: expect.arrayContaining([expect.objectContaining({ title: 'Dune' })]),
    }))
    await expect(repository.getManagedList(ownerUser.id, currentList.id)).resolves.toMatchObject({
      items: [expect.objectContaining({ title: 'Refactoring' })],
    })
  })
})


function createDragDataTransfer() {
  const data = new Map<string, string>()

  return {
    dropEffect: 'move',
    effectAllowed: 'move',
    getData: vi.fn((type: string) => data.get(type) ?? ''),
    setData: vi.fn((type: string, value: string) => data.set(type, value)),
  }
}

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
