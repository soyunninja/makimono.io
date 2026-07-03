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
  type PublicListRepository,
  type PublishPublicListInput,
} from '@/features/items/public-list-repository'
import { itemCategories, coverProviders, type Category, type CoverProvider } from '@/features/items/types'
import { PocketBaseClientResponseError } from '@/lib/pocketbase'

type PocketBasePublicListCollection = {
  create: (data: PocketBasePublicListRecordInput) => Promise<unknown>
  getFullList: (options?: { filter?: string, perPage?: number, sort?: string }) => Promise<unknown[]>
}

type CreatePocketBasePublicListRepositoryOptions = {
  collection: PocketBasePublicListCollection
  ownerId: string
  resolveOwnerAvatarUrl?: (recordId: string, fileName: string) => string | null
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
    ownerAvatar: input.owner.avatarUrl,
    slug: slug.value,
    title: input.title,
    listDate: input.listDate,
    description: input.description ?? null,
    items: input.items.map(mapPublicListItemToPayload),
    published: true,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
  }
}

export function mapPocketBasePublicListRecord(
  record: unknown,
  options: { resolveOwnerAvatarUrl?: (recordId: string, fileName: string) => string | null } = {},
): PublicList {
  if (!isRecord(record)) {
    throw new Error('Invalid PocketBase public list record.')
  }

  const id = readRequiredString(record, 'id')
  const ownerDisplayName = readRequiredString(record, 'ownerDisplayName')
  const owner: PublicOwnerProjection = {
    avatarUrl: readOwnerAvatarUrl(record, id, options),
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

export function createPocketBasePublicListRepository({
  collection,
  ownerId,
  resolveOwnerAvatarUrl,
}: CreatePocketBasePublicListRepositoryOptions): PublicListRepository {
  return {
    async publishList(input) {
      if (ownerId.trim().length === 0 || input.authenticatedOwnerId.trim() !== ownerId.trim()) {
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
        const record = await collection.create(buildPublicListPublishPayload(input, ownerId))

        return { list: mapPocketBasePublicListRecord(record, { resolveOwnerAvatarUrl }), ok: true }
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

      return record ? mapPocketBasePublicListRecord(record, { resolveOwnerAvatarUrl }) : null
    },
  }
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

function readOwnerAvatarUrl(
  record: Record<string, unknown>,
  id: string,
  options: { resolveOwnerAvatarUrl?: (recordId: string, fileName: string) => string | null },
) {
  const ownerAvatar = readOptionalString(record, 'ownerAvatar')

  if (!ownerAvatar) {
    return null
  }

  if (ownerAvatar.startsWith('/') || ownerAvatar.startsWith('http://') || ownerAvatar.startsWith('https://')) {
    return ownerAvatar
  }

  return options.resolveOwnerAvatarUrl ? options.resolveOwnerAvatarUrl(id, ownerAvatar) : null
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
