export type PublicListItemSaveCounts = Record<string, number>

export type PublicListItemSaveInput = {
  itemId: string
  publicListId: string
}

export type PublicListItemSaveRepository = {
  getItemSaveCounts: (publicListId: string) => Promise<PublicListItemSaveCounts>
  recordItemSave: (input: PublicListItemSaveInput) => Promise<void>
}

type PocketBasePublicListItemSaveCollection = {
  create: (data: Record<string, unknown>) => Promise<unknown>
  getFullList: (options?: { filter?: string, sort?: string }) => Promise<unknown[]>
}

type CreatePocketBasePublicListItemSaveRepositoryOptions = {
  collection: PocketBasePublicListItemSaveCollection
  savedByUserId?: string | null
}

export function createPocketBasePublicListItemSaveRepository({
  collection,
  savedByUserId,
}: CreatePocketBasePublicListItemSaveRepositoryOptions): PublicListItemSaveRepository {
  const normalizedSavedByUserId = savedByUserId?.trim() ?? ''

  return {
    async getItemSaveCounts(publicListId) {
      const records = await collection.getFullList({
        filter: `publicList = ${quotePocketBaseFilterValue(publicListId)}`,
        sort: '-created',
      })

      return countPublicListItemSaves(records)
    },
    async recordItemSave(input) {
      if (!normalizedSavedByUserId) {
        throw new Error('Cannot record a public list item save without an authenticated user.')
      }

      await collection.create({
        itemId: input.itemId,
        publicList: input.publicListId,
        savedBy: normalizedSavedByUserId,
      })
    },
  }
}

export function countPublicListItemSaves(records: unknown[]): PublicListItemSaveCounts {
  return records.reduce<PublicListItemSaveCounts>((counts, record) => {
    if (!isRecord(record)) {
      return counts
    }

    const itemId = readOptionalString(record, 'itemId')

    if (!itemId) {
      return counts
    }

    counts[itemId] = (counts[itemId] ?? 0) + 1

    return counts
  }, {})
}

function quotePocketBaseFilterValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function readOptionalString(record: Record<string, unknown>, field: string) {
  const value = record[field]

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
