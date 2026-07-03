import {
  clonePublicList,
  clonePublicListItem,
  normalizePublicListSlug,
  normalizePublicOwnerNamespace,
  type PublicList,
  type PublicListItem,
  type PublicOwnerProjection,
} from '@/features/items/public-list-types'

export type PublishPublicListInput = {
  authenticatedOwnerId: string
  owner: PublicOwnerProjection
  ownerNamespace: string
  slug: string
  title: string
  listDate: string
  description?: string
  items: PublicListItem[]
  publishedAt?: string
}

export type PublicListManagementSummary = {
  id: string
  ownerNamespace: string
  slug: string
  title: string
  listDate: string
  description?: string
  publishedAt: string
  updatedAt?: string
}

export type PublicListPublishError =
  | { ownerNamespace: string, slug: string, type: 'slug_collision' }
  | { field: 'ownerNamespace' | 'slug', type: 'invalid_route_part' }
  | { type: 'unauthenticated' }

export type PublicListPublishResult =
  | { list: PublicList, ok: true }
  | { error: PublicListPublishError, ok: false }

export type ManagedPublicListCreateInput = Omit<PublishPublicListInput, 'items' | 'publishedAt'> & {
  items?: PublicListItem[]
  publishedAt?: string
}

export type ManagedPublicListUpdateInput = {
  authenticatedOwnerId: string
  description?: string | null
  id: string
  items?: PublicListItem[]
  listDate?: string
  slug?: string
  title?: string
}

export type ManagedPublicListError = PublicListPublishError
  | { type: 'operation_failed' }
  | { type: 'owner_mismatch' }

export type ManagedPublicListResult =
  | { list: PublicList, ok: true }
  | { error: ManagedPublicListError, ok: false }

export type PublicListRepository = {
  createManagedList: (input: ManagedPublicListCreateInput) => Promise<ManagedPublicListResult>
  getManagedList: (authenticatedOwnerId: string, id: string) => Promise<PublicList | null>
  publishList: (input: PublishPublicListInput) => Promise<PublicListPublishResult>
  getByOwnerAndSlug: (ownerNamespace: string, slug: string) => Promise<PublicList | null>
  updateManagedList: (input: ManagedPublicListUpdateInput) => Promise<ManagedPublicListResult>
  listMine: () => Promise<PublicListManagementSummary[]>
}

type InMemoryPublicListSeed = PublicList & {
  ownerId?: string
  published?: boolean
}

type InMemoryPublicListRecord = {
  list: PublicList
  ownerId: string
  published: boolean
}

type CreateInMemoryPublicListRepositoryOptions = {
  ownerId?: string
}

export function createPublicListSlugCollisionError(ownerNamespace: string, slug: string): PublicListPublishError {
  return { ownerNamespace, slug, type: 'slug_collision' }
}

export function isPublicListSlugCollisionError(error: PublicListPublishError): error is Extract<PublicListPublishError, { type: 'slug_collision' }> {
  return error.type === 'slug_collision'
}

export function createInMemoryPublicListRepository(
  initialLists: InMemoryPublicListSeed[] = [],
  options: CreateInMemoryPublicListRepositoryOptions = {},
): PublicListRepository {
  const currentOwnerId = options.ownerId?.trim() ?? ''
  const records: InMemoryPublicListRecord[] = initialLists.map((list) => ({
    list: clonePublicList(list),
    ownerId: list.ownerId?.trim() ?? '',
    published: list.published !== false,
  }))

  return {
    async createManagedList(input) {
      if (!currentOwnerId || input.authenticatedOwnerId.trim() !== currentOwnerId) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

      return createManagedListRecord(records, input, currentOwnerId)
    },
    async getManagedList(authenticatedOwnerId, id) {
      if (!currentOwnerId || authenticatedOwnerId.trim() !== currentOwnerId) {
        return null
      }

      const record = records.find((record) => record.published && record.ownerId === currentOwnerId && record.list.id === id)

      return record ? clonePublicList(record.list) : null
    },
    async publishList(input) {
      if (input.authenticatedOwnerId.trim().length === 0) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

      return createManagedListRecord(records, input, input.authenticatedOwnerId.trim())
    },
    async getByOwnerAndSlug(ownerNamespaceInput, slugInput) {
      const ownerNamespace = normalizePublicOwnerNamespace(ownerNamespaceInput)
      const slug = normalizePublicListSlug(slugInput)

      if (!ownerNamespace.ok || !slug.ok) {
        return null
      }

      const record = records.find((record) => record.published
        && record.list.ownerNamespace === ownerNamespace.value
        && record.list.slug === slug.value)

      return record ? clonePublicList(record.list) : null
    },
    async updateManagedList(input) {
      if (!currentOwnerId || input.authenticatedOwnerId.trim() !== currentOwnerId) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

      const record = records.find((record) => record.published && record.ownerId === currentOwnerId && record.list.id === input.id)

      if (!record) {
        return { error: { type: 'owner_mismatch' }, ok: false }
      }

      const slug = input.slug === undefined ? null : normalizePublicListSlug(input.slug)

      if (slug?.ok === false) {
        return { error: { field: 'slug', type: 'invalid_route_part' }, ok: false }
      }

      const nextSlug = slug?.value ?? record.list.slug

      if (records.some(({ list }) => list.id !== record.list.id && list.ownerNamespace === record.list.ownerNamespace && list.slug === nextSlug)) {
        return { error: createPublicListSlugCollisionError(record.list.ownerNamespace, nextSlug), ok: false }
      }

      const { description: currentDescription, ...currentList } = record.list
      const nextDescription = input.description !== undefined ? input.description : currentDescription
      const updatedList: PublicList = {
        ...currentList,
        slug: nextSlug,
        title: input.title ?? record.list.title,
        listDate: input.listDate ?? record.list.listDate,
        ...(nextDescription !== null && nextDescription !== undefined ? { description: nextDescription } : {}),
        items: input.items?.map(clonePublicListItem) ?? record.list.items.map(clonePublicListItem),
        updatedAt: new Date().toISOString(),
      }

      record.list = clonePublicList(updatedList)

      return { list: clonePublicList(record.list), ok: true }
    },
    async listMine() {
      if (!currentOwnerId) {
        return []
      }

      return records
        .filter((record) => record.published && record.ownerId === currentOwnerId)
        .sort((left, right) => right.list.publishedAt.localeCompare(left.list.publishedAt))
        .map(({ list }) => mapPublicListManagementSummary(list))
    },
  }
}

function createManagedListRecord(
  records: InMemoryPublicListRecord[],
  input: ManagedPublicListCreateInput,
  ownerId: string,
): PublicListPublishResult {
  const ownerNamespace = normalizePublicOwnerNamespace(input.ownerNamespace)

  if (!ownerNamespace.ok) {
    return { error: { field: 'ownerNamespace', type: 'invalid_route_part' }, ok: false }
  }

  const slug = normalizePublicListSlug(input.slug)

  if (!slug.ok) {
    return { error: { field: 'slug', type: 'invalid_route_part' }, ok: false }
  }

  if (records.some(({ list }) => list.ownerNamespace === ownerNamespace.value && list.slug === slug.value)) {
    return { error: createPublicListSlugCollisionError(ownerNamespace.value, slug.value), ok: false }
  }

  const list: PublicList = {
    id: `${ownerNamespace.value}-${slug.value}`,
    owner: { ...input.owner },
    ownerNamespace: ownerNamespace.value,
    slug: slug.value,
    title: input.title,
    listDate: input.listDate,
    ...(input.description !== undefined ? { description: input.description } : {}),
    items: input.items?.map(clonePublicListItem) ?? [],
    publishedAt: input.publishedAt ?? new Date().toISOString(),
  }

  records.push({ list: clonePublicList(list), ownerId, published: true })

  return { list: clonePublicList(list), ok: true }
}

function mapPublicListManagementSummary(list: PublicList): PublicListManagementSummary {
  return {
    id: list.id,
    ownerNamespace: list.ownerNamespace,
    slug: list.slug,
    title: list.title,
    listDate: list.listDate,
    ...(list.description !== undefined ? { description: list.description } : {}),
    publishedAt: list.publishedAt,
    ...(list.updatedAt !== undefined ? { updatedAt: list.updatedAt } : {}),
  }
}
