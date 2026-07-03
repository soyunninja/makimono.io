import {
  clonePublicList,
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

export type PublicListRepository = {
  publishList: (input: PublishPublicListInput) => Promise<PublicListPublishResult>
  getByOwnerAndSlug: (ownerNamespace: string, slug: string) => Promise<PublicList | null>
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
    async publishList(input) {
      if (input.authenticatedOwnerId.trim().length === 0) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

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
        items: input.items.map((item) => ({ ...item, tags: [...item.tags] })),
        publishedAt: input.publishedAt ?? new Date().toISOString(),
      }

      records.push({
        list: clonePublicList(list),
        ownerId: input.authenticatedOwnerId.trim(),
        published: true,
      })

      return { list: clonePublicList(list), ok: true }
    },
    async getByOwnerAndSlug(ownerNamespaceInput, slugInput) {
      const ownerNamespace = normalizePublicOwnerNamespace(ownerNamespaceInput)
      const slug = normalizePublicListSlug(slugInput)

      if (!ownerNamespace.ok || !slug.ok) {
        return null
      }

      const record = records.find(({ list }) => list.ownerNamespace === ownerNamespace.value && list.slug === slug.value)

      return record ? clonePublicList(record.list) : null
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
