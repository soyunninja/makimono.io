import { resolvePublicOwnerInitial } from '@/features/auth/public-profile'
import {
  clonePublicList,
  normalizePublicListSlug,
  normalizePublicOwnerNamespace,
  type PublicList,
  type PublicListItem,
  type PublicOwnerProjection,
} from '@/features/items/public-list-types'
import {
  createPublicListSlugCollisionError,
  type ManagedPublicListCreateInput,
  type ManagedPublicListUpdateInput,
  type PublicListManagementSummary,
  type PublicListRepository,
  type PublicOwnerListSummary,
  type PublishPublicListInput,
} from '@/features/items/public-list-repository'
import { itemCategories, coverProviders, type Category, type CoverProvider } from '@/features/items/types'
import { PocketBaseClientResponseError } from '@/lib/pocketbase'

type PocketBasePublicListCollection = {
  create: (data: PocketBasePublicListRecordInput) => Promise<unknown>
  delete: (id: string) => Promise<unknown>
  getFullList: (options?: { filter?: string, perPage?: number, sort?: string }) => Promise<unknown[]>
  update: (id: string, data: PocketBasePublicListRecordInput) => Promise<unknown>
}

type CreatePocketBasePublicListRepositoryOptions = {
  collection: PocketBasePublicListCollection
  ownerId: string
  ownerNamespace?: string | null
}

export type PocketBasePublicListRecordInput = Record<string, unknown>

const categorySet = new Set<Category>(itemCategories)
const coverProviderSet = new Set<CoverProvider>(coverProviders)
const hasOwn = Object.prototype.hasOwnProperty

export function buildPublicListPublishPayload(input: PublishPublicListInput, ownerId: string): PocketBasePublicListRecordInput {
  const ownerNamespace = normalizePublicOwnerNamespace(input.ownerNamespace)
  const slug = normalizePublicListSlug(input.slug)

  if (!ownerNamespace.ok || !slug.ok) {
    throw new Error('Cannot build a PocketBase public list payload with invalid route parts.')
  }

  return {
    owner: ownerId,
    ownerNamespace: ownerNamespace.value,
    ownerDisplayName: input.owner.displayName,
    slug: slug.value,
    title: input.title,
    listDate: input.listDate,
    ...(input.description !== undefined ? { description: input.description } : {}),
    items: input.items.map(mapPublicListItemToPayload),
    published: true,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
  }
}

export function buildManagedPublicListCreatePayload(input: ManagedPublicListCreateInput, ownerId: string): PocketBasePublicListRecordInput {
  return buildPublicListPublishPayload({
    ...input,
    items: input.items ?? [],
  }, ownerId)
}

export function buildManagedPublicListUpdatePayload(input: ManagedPublicListUpdateInput): PocketBasePublicListRecordInput {
  const payload: PocketBasePublicListRecordInput = {}

  if (input.title !== undefined) {
    payload.title = input.title
  }

  if (input.listDate !== undefined) {
    payload.listDate = input.listDate
  }

  if (hasOwn.call(input, 'description')) {
    payload.description = input.description ?? null
  }

  if (input.slug !== undefined) {
    const slug = normalizePublicListSlug(input.slug)

    if (!slug.ok) {
      throw new Error('Cannot build a PocketBase public list update payload with an invalid slug.')
    }

    payload.slug = slug.value
  }

  if (input.items !== undefined) {
    payload.items = input.items.map(mapPublicListItemToPayload)
  }

  return payload
}

export function mapPocketBasePublicListRecord(
  record: unknown,
): PublicList {
  if (!isRecord(record)) {
    throw new Error('Invalid PocketBase public list record.')
  }

  const id = readRequiredString(record, 'id')
  const ownerDisplayName = readRequiredString(record, 'ownerDisplayName')
  const owner: PublicOwnerProjection = {
    avatarUrl: null,
    displayName: ownerDisplayName,
    initial: resolvePublicOwnerInitial(ownerDisplayName),
  }

  const published = record.published

  if (published !== true) {
    throw new Error('PocketBase public list record is not published.')
  }

  const description = readOptionalString(record, 'description')
  const updatedAt = readOptionalString(record, 'updated')

  const mappedList: PublicList = {
    id,
    owner,
    ownerNamespace: readRequiredString(record, 'ownerNamespace'),
    slug: readRequiredString(record, 'slug'),
    title: readRequiredString(record, 'title'),
    listDate: readRequiredString(record, 'listDate'),
    ...(description ? { description } : {}),
    items: mapPublicListItems(record.items),
    publishedAt: readRequiredString(record, 'publishedAt'),
    ...(updatedAt ? { updatedAt } : {}),
  }

  return clonePublicList(mappedList)
}

export function mapPocketBasePublicOwnerListSummary(
  record: unknown,
): PublicOwnerListSummary {
  const list = mapPocketBasePublicListRecord(record)

  return {
    ...mapPublicListManagementSummaryFromList(list),
    owner: { ...list.owner },
  }
}

export function mapPocketBasePublicListManagementSummary(record: unknown): PublicListManagementSummary {
  if (!isRecord(record)) {
    throw new Error('Invalid PocketBase public list record.')
  }

  if (record.published !== true) {
    throw new Error('PocketBase public list record is not published.')
  }

  const description = readOptionalString(record, 'description')
  const updatedAt = readOptionalString(record, 'updated')

  return {
    id: readRequiredString(record, 'id'),
    ownerNamespace: readRequiredString(record, 'ownerNamespace'),
    slug: readRequiredString(record, 'slug'),
    title: readRequiredString(record, 'title'),
    listDate: readRequiredString(record, 'listDate'),
    ...(description ? { description } : {}),
    publishedAt: readRequiredString(record, 'publishedAt'),
    ...(updatedAt ? { updatedAt } : {}),
  }
}

export function createPocketBasePublicListRepository({
  collection,
  ownerId,
  ownerNamespace,
}: CreatePocketBasePublicListRepositoryOptions): PublicListRepository {
  const normalizedOwnerId = ownerId.trim()
  const normalizedOwnerNamespace = ownerNamespace ? normalizePublicOwnerNamespace(ownerNamespace) : null
  const ownerNamespaceFilter = normalizedOwnerNamespace?.ok ? `ownerNamespace = ${quotePocketBaseFilterValue(normalizedOwnerNamespace.value)}` : null

  return {
    async createManagedList(input) {
      if (!normalizedOwnerId || input.authenticatedOwnerId.trim() !== normalizedOwnerId) {
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

      try {
        const record = await collection.create(buildManagedPublicListCreatePayload(input, normalizedOwnerId))

        return { list: mapPocketBasePublicListRecord(record), ok: true }
      }
      catch (error) {
        if (isPocketBasePublicListCollisionError(error)) {
          return { error: createPublicListSlugCollisionError(ownerNamespace.value, slug.value), ok: false }
        }

        if (isPocketBaseRecoverableMutationError(error)) {
          return { error: { type: 'operation_failed' }, ok: false }
        }

        throw error
      }
    },
    async deleteManagedList(authenticatedOwnerId, id) {
      if (!normalizedOwnerId || authenticatedOwnerId.trim() !== normalizedOwnerId) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

      const currentRecord = await getManagedPublicListRecord(collection, normalizedOwnerId, id, ownerNamespaceFilter)

      if (!currentRecord) {
        return { error: { type: 'owner_mismatch' }, ok: false }
      }

      try {
        await collection.delete(id)

        return { ok: true }
      }
      catch (error) {
        if (isPocketBaseRecoverableMutationError(error)) {
          return { error: { type: 'operation_failed' }, ok: false }
        }

        throw error
      }
    },
    async getManagedList(authenticatedOwnerId, id) {
      if (!normalizedOwnerId || authenticatedOwnerId.trim() !== normalizedOwnerId) {
        return null
      }

      const record = await getManagedPublicListRecord(collection, normalizedOwnerId, id, ownerNamespaceFilter)

      return record ? mapPocketBasePublicListRecord(record) : null
    },
    async publishList(input) {
      if (normalizedOwnerId.length === 0 || input.authenticatedOwnerId.trim() !== normalizedOwnerId) {
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

      try {
        const record = await collection.create(buildPublicListPublishPayload(input, normalizedOwnerId))

        return { list: mapPocketBasePublicListRecord(record), ok: true }
      }
      catch (error) {
        if (isPocketBasePublicListCollisionError(error)) {
          return { error: createPublicListSlugCollisionError(ownerNamespace.value, slug.value), ok: false }
        }

        throw error
      }
    },
    async getByOwnerAndSlug(ownerNamespaceInput, slugInput) {
      const ownerNamespace = normalizePublicOwnerNamespace(ownerNamespaceInput)
      const slug = normalizePublicListSlug(slugInput)

      if (!ownerNamespace.ok || !slug.ok) {
        return null
      }

      const records = await collection.getFullList({
        filter: `published = true && ownerNamespace = ${quotePocketBaseFilterValue(ownerNamespace.value)} && slug = ${quotePocketBaseFilterValue(slug.value)}`,
        perPage: 1,
        sort: '-publishedAt',
      })
      const record = records[0]

      return record ? mapPocketBasePublicListRecord(record) : null
    },
    async listByOwner(ownerNamespaceInput) {
      const ownerNamespace = normalizePublicOwnerNamespace(ownerNamespaceInput)

      if (!ownerNamespace.ok) {
        return null
      }

      const records = await collection.getFullList({
        filter: `published = true && ownerNamespace = ${quotePocketBaseFilterValue(ownerNamespace.value)}`,
        sort: '-publishedAt',
      })
      const lists = records.map((record) => mapPocketBasePublicOwnerListSummary(record))

      if (lists.length === 0) {
        return null
      }

      return {
        lists,
        owner: { ...lists[0].owner },
        ownerNamespace: ownerNamespace.value,
      }
    },
    async updateManagedList(input) {
      if (!normalizedOwnerId || input.authenticatedOwnerId.trim() !== normalizedOwnerId) {
        return { error: { type: 'unauthenticated' }, ok: false }
      }

      const currentRecord = await getManagedPublicListRecord(collection, normalizedOwnerId, input.id, ownerNamespaceFilter)

      if (!currentRecord) {
        return { error: { type: 'owner_mismatch' }, ok: false }
      }

      const currentList = mapPocketBasePublicListRecord(currentRecord)
      const slug = input.slug === undefined ? null : normalizePublicListSlug(input.slug)

      if (slug?.ok === false) {
        return { error: { field: 'slug', type: 'invalid_route_part' }, ok: false }
      }

      try {
        const record = await collection.update(input.id, buildManagedPublicListUpdatePayload(input))

        return { list: mapPocketBasePublicListRecord(record), ok: true }
      }
      catch (error) {
        if (isPocketBasePublicListCollisionError(error)) {
          return { error: createPublicListSlugCollisionError(currentList.ownerNamespace, slug?.value ?? currentList.slug), ok: false }
        }

        if (isPocketBaseRecoverableMutationError(error)) {
          return { error: { type: 'operation_failed' }, ok: false }
        }

        throw error
      }
    },
    async listMine() {
      if (!normalizedOwnerId) {
        return []
      }

      if (!ownerNamespaceFilter) {
        return []
      }

      const records = await collection.getFullList({
        filter: `published = true && owner = ${quotePocketBaseFilterValue(normalizedOwnerId)} && ${ownerNamespaceFilter}`,
        sort: '-publishedAt',
      })

      return records.map(mapPocketBasePublicListManagementSummary)
    },
  }
}

function mapPublicListManagementSummaryFromList(list: PublicList): PublicListManagementSummary {
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

async function getManagedPublicListRecord(
  collection: PocketBasePublicListCollection,
  ownerId: string,
  id: string,
  ownerNamespaceFilter: string | null,
) {
  if (!ownerNamespaceFilter) {
    return null
  }

  const records = await collection.getFullList({
    filter: `published = true && owner = ${quotePocketBaseFilterValue(ownerId)} && ${ownerNamespaceFilter} && id = ${quotePocketBaseFilterValue(id)}`,
    perPage: 1,
  })

  return records[0] ?? null
}

function mapPublicListItemToPayload(item: PublicListItem): PocketBasePublicListRecordInput {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    notes: item.notes ?? null,
    tags: [...item.tags],
    coverImageUrl: item.coverImageUrl ?? null,
    coverProvider: item.coverProvider ?? null,
    coverMatchedTitle: item.coverMatchedTitle ?? null,
  }
}

function mapPublicListItems(value: unknown): PublicListItem[] {
  if (!Array.isArray(value)) {
    throw new Error('PocketBase public list items must be an array.')
  }

  return value.map(mapPublicListItem)
}

function mapPublicListItem(value: unknown): PublicListItem {
  if (!isRecord(value)) {
    throw new Error('Invalid PocketBase public list item.')
  }

  const category = readRequiredString(value, 'category')

  if (!categorySet.has(category as Category)) {
    throw new Error('Invalid PocketBase public list item category.')
  }

  const coverProvider = readOptionalString(value, 'coverProvider')
  const notes = readOptionalString(value, 'notes')
  const coverImageUrl = readOptionalString(value, 'coverImageUrl')
  const coverMatchedTitle = readOptionalString(value, 'coverMatchedTitle')

  if (coverProvider && !coverProviderSet.has(coverProvider as CoverProvider)) {
    throw new Error('Invalid PocketBase public list item cover provider.')
  }

  return {
    id: readRequiredString(value, 'id'),
    category: category as Category,
    title: readRequiredString(value, 'title'),
    ...(notes ? { notes } : {}),
    tags: readStringArray(value.tags),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(coverProvider ? { coverProvider: coverProvider as CoverProvider } : {}),
    ...(coverMatchedTitle ? { coverMatchedTitle } : {}),
  }
}

function isPocketBasePublicListCollisionError(error: unknown) {
  if (!(error instanceof PocketBaseClientResponseError) || error.status !== 400) {
    return false
  }

  const responseText = JSON.stringify(error.response).toLowerCase()
  const messageText = error.message.toLowerCase()

  return responseText.includes('idx_public_lists_owner_namespace_slug')
    || responseText.includes('ownernamespace') && responseText.includes('slug')
    || messageText.includes('ownernamespace') && messageText.includes('slug')
}

function isPocketBaseRecoverableMutationError(error: unknown) {
  return error instanceof PocketBaseClientResponseError
}

function quotePocketBaseFilterValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function readRequiredString(record: Record<string, unknown>, field: string) {
  const value = readOptionalString(record, field)

  if (!value) {
    throw new Error(`PocketBase public list record is missing ${field}.`)
  }

  return value
}

function readOptionalString(record: Record<string, unknown>, field: string) {
  const value = record[field]

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readStringArray(value: unknown) {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
