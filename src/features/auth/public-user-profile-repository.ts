import { resolvePublicOwnerInitial, validateUsername } from '@/features/auth/public-profile'
import { normalizePublicOwnerNamespace, type PublicOwnerProjection } from '@/features/items/public-list-types'

export type PublicUserProfile = {
  owner: PublicOwnerProjection
  ownerNamespace: string
}

export type PublicUserProfileRepository = {
  getByUsername: (username: string) => Promise<PublicUserProfile | null>
}

type PocketBasePublicUserCollection = {
  getFullList: (options?: { filter?: string, perPage?: number }) => Promise<unknown[]>
}

type CreatePocketBasePublicUserProfileRepositoryOptions = {
  collection: PocketBasePublicUserCollection
  resolveAvatarUrl?: (recordId: string, fileName: string) => string | null
}

export function createPocketBasePublicUserProfileRepository({
  collection,
  resolveAvatarUrl,
}: CreatePocketBasePublicUserProfileRepositoryOptions): PublicUserProfileRepository {
  return {
    async getByUsername(usernameInput) {
      const username = validateUsername(usernameInput)

      if (!username.ok) {
        return null
      }

      const records = await collection.getFullList({
        filter: `username = ${quotePocketBaseFilterValue(username.username)}`,
        perPage: 1,
      })
      const record = records[0]

      return record ? mapPocketBasePublicUserProfileRecord(record, { resolveAvatarUrl }) : null
    },
  }
}

export function createFallbackPublicUserProfile(usernameInput: string): PublicUserProfile | null {
  const ownerNamespace = normalizePublicOwnerNamespace(usernameInput)

  if (!ownerNamespace.ok) {
    return null
  }

  return {
    owner: {
      avatarUrl: null,
      displayName: ownerNamespace.value,
      initial: resolvePublicOwnerInitial(ownerNamespace.value),
    },
    ownerNamespace: ownerNamespace.value,
  }
}

export function mapPocketBasePublicUserProfileRecord(
  record: unknown,
  options: { resolveAvatarUrl?: (recordId: string, fileName: string) => string | null } = {},
): PublicUserProfile | null {
  if (!isRecord(record)) {
    return null
  }

  const id = readRequiredString(record, 'id')
  const username = validateUsername(readRequiredString(record, 'username'))

  if (!username.ok) {
    return null
  }

  const ownerNamespace = normalizePublicOwnerNamespace(username.username)

  if (!ownerNamespace.ok) {
    return null
  }

  const avatarFileName = readOptionalString(record, 'avatar')
  const avatarUrl = avatarFileName && options.resolveAvatarUrl
    ? options.resolveAvatarUrl(id, avatarFileName)
    : null

  return {
    owner: {
      avatarUrl,
      displayName: username.username,
      initial: resolvePublicOwnerInitial(username.username),
    },
    ownerNamespace: ownerNamespace.value,
  }
}

function quotePocketBaseFilterValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function readRequiredString(record: Record<string, unknown>, field: string) {
  const value = readOptionalString(record, field)

  if (!value) {
    throw new Error(`PocketBase public user profile record is missing ${field}.`)
  }

  return value
}

function readOptionalString(record: Record<string, unknown>, field: string) {
  const value = record[field]

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
