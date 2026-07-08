import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PublicListCreateScreen } from '@/features/items/public-list-create-screen'
import { createInMemoryPublicListRepository, type PublicListRepository } from '@/features/items/public-list-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

const ownerUser = {
  email: 'owner@example.com',
  id: 'user-owner',
  username: 'mariano',
} satisfies PocketBaseAuthRecord

function renderCreateScreen(options: {
  onCreated?: (listId: string) => void
  repository?: PublicListRepository
  user?: PocketBaseAuthRecord | null
} = {}) {
  const onCreated = options.onCreated ?? vi.fn()

  render(
    <LocaleProvider initialLocale={'en'}>
      <PublicListCreateScreen
        authenticatedUser={options.user ?? ownerUser}
        onCreated={onCreated}
        repository={options.repository ?? createInMemoryPublicListRepository([], { ownerId: ownerUser.id })}
      />
    </LocaleProvider>,
  )

  return { onCreated }
}

function submitCreateForm(input: { description?: string, slug: string, title: string }) {
  fireEvent.change(screen.getByLabelText('Public list title'), { target: { value: input.title } })
  fireEvent.change(screen.getByLabelText('Public URL slug'), { target: { value: input.slug } })

  if (input.description !== undefined) {
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: input.description } })
  }

  fireEvent.click(screen.getByRole('button', { name: 'Create list' }))
}

describe('PublicListCreateScreen', () => {
  it('validates required public-list fields before creating', async () => {
    const repository = createInMemoryPublicListRepository([], { ownerId: ownerUser.id })
    const createManagedList = vi.spyOn(repository, 'createManagedList')

    renderCreateScreen({ repository })

    const form = screen.getByRole('button', { name: 'Create list' }).closest('form')

    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)

    expect(await screen.findByRole('alert')).toHaveTextContent('Add a title, URL slug, and list date before creating the list.')
    expect(createManagedList).not.toHaveBeenCalled()
  })

  it('creates an owner-scoped public list and navigates to its manager', async () => {
    const repository = createInMemoryPublicListRepository([], { ownerId: ownerUser.id })
    const onCreated = vi.fn()

    renderCreateScreen({ onCreated, repository })

    submitCreateForm({ description: 'Books for the summer break.', slug: 'summer-books', title: 'Summer Books' })

    expect(await screen.findByRole('status')).toHaveTextContent('Public list created. Opening the list manager…')

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('mariano-summer-books')
    })

    const createdList = await repository.getManagedList(ownerUser.id, 'mariano-summer-books')

    expect(createdList?.title).toBe('Summer Books')
    expect(createdList?.items).toEqual([])
    expect(await repository.getManagedList('other-user', 'mariano-summer-books')).toBeNull()
  })

  it('requires an authenticated username before creating a public list', async () => {
    const repository = createInMemoryPublicListRepository([], { ownerId: ownerUser.id })
    const createManagedList = vi.spyOn(repository, 'createManagedList')

    renderCreateScreen({ repository, user: { email: 'owner@example.com', id: ownerUser.id } })

    submitCreateForm({ slug: 'summer-books', title: 'Summer Books' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Use a valid public profile namespace and slug.')
    expect(createManagedList).not.toHaveBeenCalled()
  })

  it('shows a recoverable failure state without navigating to a failed list', async () => {
    const repository: PublicListRepository = {
      createManagedList: vi.fn<PublicListRepository['createManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
      deleteManagedList: vi.fn<PublicListRepository['deleteManagedList']>(async () => ({ ok: true })),
      getByOwnerAndSlug: vi.fn(async () => null),
      getManagedList: vi.fn(async () => null),
      listByOwner: vi.fn(async () => null),
      listMine: vi.fn(async () => []),
      publishList: vi.fn<PublicListRepository['publishList']>(async () => ({ error: { type: 'unauthenticated' }, ok: false })),
      updateManagedList: vi.fn<PublicListRepository['updateManagedList']>(async () => ({ error: { type: 'operation_failed' }, ok: false })),
    }
    const onCreated = vi.fn()

    renderCreateScreen({ onCreated, repository })

    submitCreateForm({ slug: 'summer-books', title: 'Summer Books' })

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not create the public list. Try again in a moment.')
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.queryByText('Public list created. Opening the list manager…')).not.toBeInTheDocument()
  })
})
