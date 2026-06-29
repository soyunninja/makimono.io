import type { InterestRepository, ItemStatus } from '@/features/items/types'

import {
  cloneInterestItem,
  filterInterestItems,
  isInterestItem,
  normalizeTags,
} from '@/features/items/repository-helpers'
import { isPocketBaseNotFoundError } from '@/lib/pocketbase'

type PocketBaseInterestRecord = {
  id: string
  category: unknown
  title: unknown
  status: unknown
  notes?: unknown
  tags?: unknown
  created: unknown
  deletedAt?: unknown
  coverImageUrl?: unknown
  coverProvider?: unknown
  coverMatchedTitle?: unknown
}

type PocketBaseInterestRecordInput = Record<string, unknown>

type PocketBaseInterestCollection = {
  getFullList: (options?: { sort?: string }) => Promise<unknown[]>
  create: (data: PocketBaseInterestRecordInput) => Promise<unknown>
  update: (id: string, data: PocketBaseInterestRecordInput) => Promise<unknown>
}

type CreatePocketBaseInterestRepositoryOptions = {
  collection: PocketBaseInterestCollection
  userId: string
}

const hasOwn = Object.prototype.hasOwnProperty

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isPocketBaseInterestRecord(value: unknown): value is PocketBaseInterestRecord {
  return typeof value === 'object' && value !== null && hasOwn.call(value, 'id') && hasOwn.call(value, 'created')
}

function mapPocketBaseRecord(record: unknown) {
  if (!isPocketBaseInterestRecord(record)) {
    throw new Error('Invalid PocketBase interest record.')
  }

  const mappedItem = {
    id: record.id,
    category: record.category,
    title: record.title,
    status: record.status,
    notes: isString(record.notes) && record.notes.trim().length > 0 ? record.notes : undefined,
    tags: isStringArray(record.tags) ? record.tags : [],
    createdAt: record.created,
    deletedAt: isString(record.deletedAt) && record.deletedAt.trim().length > 0 ? record.deletedAt : undefined,
    coverImageUrl: isString(record.coverImageUrl) && record.coverImageUrl.trim().length > 0 ? record.coverImageUrl : undefined,
    coverProvider: isString(record.coverProvider) ? record.coverProvider : undefined,
    coverMatchedTitle: isString(record.coverMatchedTitle) && record.coverMatchedTitle.trim().length > 0 ? record.coverMatchedTitle : undefined,
  }

  if (!isInterestItem(mappedItem)) {
    throw new Error('PocketBase interest record does not match the expected schema.')
  }

  return cloneInterestItem(mappedItem)
}

function buildCreatePayload(input: Parameters<InterestRepository['createItem']>[0], userId: string): PocketBaseInterestRecordInput {
  return {
    user: userId,
    category: input.category,
    title: input.title,
    status: 'pending',
    notes: input.notes ?? null,
    tags: normalizeTags(input.tags),
    coverImageUrl: input.coverImageUrl ?? null,
    coverProvider: input.coverProvider ?? null,
    coverMatchedTitle: input.coverMatchedTitle ?? null,
  }
}

function buildUpdatePayload(input: Parameters<InterestRepository['updateItem']>[1]): PocketBaseInterestRecordInput {
  const payload: PocketBaseInterestRecordInput = {}

  if (input.category !== undefined) {
    payload.category = input.category
  }

  if (input.title !== undefined) {
    payload.title = input.title
  }

  if (hasOwn.call(input, 'notes')) {
    payload.notes = input.notes ?? null
  }

  if (input.tags !== undefined) {
    payload.tags = normalizeTags(input.tags)
  }

  if (hasOwn.call(input, 'coverImageUrl')) {
    payload.coverImageUrl = input.coverImageUrl ?? null
  }

  if (hasOwn.call(input, 'coverProvider')) {
    payload.coverProvider = input.coverProvider ?? null
  }

  if (hasOwn.call(input, 'coverMatchedTitle')) {
    payload.coverMatchedTitle = input.coverMatchedTitle ?? null
  }

  return payload
}

async function updatePocketBaseItem(
  collection: PocketBaseInterestCollection,
  id: string,
  payload: PocketBaseInterestRecordInput,
) {
  try {
    return mapPocketBaseRecord(await collection.update(id, payload))
  }
  catch (error) {
    if (isPocketBaseNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export function createPocketBaseInterestRepository({ collection, userId }: CreatePocketBaseInterestRepositoryOptions): InterestRepository {
  return {
    async listItems(options) {
      const items = (await collection.getFullList({ sort: '-created' })).map(mapPocketBaseRecord)

      return filterInterestItems(items, options)
    },
    async createItem(input) {
      return mapPocketBaseRecord(await collection.create(buildCreatePayload(input, userId)))
    },
    async updateItem(id, input) {
      return updatePocketBaseItem(collection, id, buildUpdatePayload(input))
    },
    async updateStatus(id: string, status: ItemStatus) {
      return updatePocketBaseItem(collection, id, { status })
    },
    async deleteItem(id) {
      return updatePocketBaseItem(collection, id, { deletedAt: new Date().toISOString() })
    },
    async restoreItem(id) {
      return updatePocketBaseItem(collection, id, { deletedAt: null })
    },
  }
}
