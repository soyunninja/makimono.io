import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

export type UserPublicProfile = {
  username: string
  avatarUrl: string | null
}

export type UpdatePublicProfileInput = {
  username: string
  avatarFile?: File | null
}

export type UsernameValidationError = 'required' | 'too_short' | 'too_long' | 'invalid_format'

export type UsernameValidationResult =
  | { ok: true, username: string }
  | { error: UsernameValidationError, ok: false, username: string }

type MapAuthRecordOptions = {
  resolveAvatarUrl?: (avatarFileName: string) => string | null
}

const usernamePattern = /^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$/

export const usernameLimits = {
  max: 30,
  min: 3,
} as const

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export function validateUsername(username: string): UsernameValidationResult {
  const normalizedUsername = normalizeUsername(username)

  if (normalizedUsername.length === 0) {
    return { error: 'required', ok: false, username: normalizedUsername }
  }

  if (normalizedUsername.length < usernameLimits.min) {
    return { error: 'too_short', ok: false, username: normalizedUsername }
  }

  if (normalizedUsername.length > usernameLimits.max) {
    return { error: 'too_long', ok: false, username: normalizedUsername }
  }

  if (!usernamePattern.test(normalizedUsername)) {
    return { error: 'invalid_format', ok: false, username: normalizedUsername }
  }

  return { ok: true, username: normalizedUsername }
}

export function mapAuthRecordToUserPublicProfile(
  record: PocketBaseAuthRecord | null | undefined,
  options: MapAuthRecordOptions = {},
): UserPublicProfile | null {
  const username = readStringField(record, 'username')

  if (username === null) {
    return null
  }

  const usernameValidation = validateUsername(username)

  if (!usernameValidation.ok) {
    return null
  }

  const avatarFileName = readStringField(record, 'avatar')

  return {
    avatarUrl: avatarFileName && options.resolveAvatarUrl ? options.resolveAvatarUrl(avatarFileName) : null,
    username: usernameValidation.username,
  }
}

function readStringField(record: PocketBaseAuthRecord | null | undefined, field: string) {
  if (!record) {
    return null
  }

  const value = record[field]

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}
