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
}

export function createPublicListSlugCollisionError(ownerNamespace: string, slug: string): PublicListPublishError {
  return { ownerNamespace, slug, type: 'slug_collision' }
}

export function isPublicListSlugCollisionError(error: PublicListPublishError): error is Extract<PublicListPublishError, { type: 'slug_collision' }> {
  return error.type === 'slug_collision'
}

export function createInMemoryPublicListRepository(initialLists: PublicList[] = []): PublicListRepository {
  const lists = initialLists.map(clonePublicList)

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

      if (lists.some((list) => list.ownerNamespace === ownerNamespace.value && list.slug === slug.value)) {
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

      lists.push(clonePublicList(list))

      return { list: clonePublicList(list), ok: true }
    },
    async getByOwnerAndSlug(ownerNamespaceInput, slugInput) {
      const ownerNamespace = normalizePublicOwnerNamespace(ownerNamespaceInput)
      const slug = normalizePublicListSlug(slugInput)

      if (!ownerNamespace.ok || !slug.ok) {
        return null
      }

      const list = lists.find((entry) => entry.ownerNamespace === ownerNamespace.value && entry.slug === slug.value)

      return list ? clonePublicList(list) : null
    },
  }
}
