import type { PocketBaseAuthRecord } from '@/lib/pocketbase'
import type { PublicOwnerProjection } from '@/features/items/public-list-types'

import { normalizePublicRoutePart } from '@/features/items/public-list-types'

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

type PublicOwnerProfileInput = Record<string, unknown> & {
  avatar?: unknown
  avatarUrl?: unknown
  displayName?: unknown
  email?: unknown
  name?: unknown
  username?: unknown
}

type MapPublicOwnerProjectionOptions = {
  resolveAvatarUrl?: (avatarFileName: string) => string | null
}

export type PublicOwnerAvatarPresentation =
  | { kind: 'image', url: string }
  | { initial: string, kind: 'gradient-initial' }

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

export function resolveEmailPrefixPublicName(email: string | null | undefined) {
  const prefix = email?.split('@')[0]?.trim() ?? ''
  const normalizedPrefix = normalizePublicRoutePart(prefix)

  return normalizedPrefix.ok ? normalizedPrefix.value : null
}

export function resolvePublicOwnerDisplayName(owner: PublicOwnerProfileInput | null | undefined) {
  const username = readStringField(owner, 'username')

  if (username) {
    return normalizeUsername(username)
  }

  const displayName = resolveSafePublicName(readStringField(owner, 'displayName') ?? readStringField(owner, 'name'))

  if (displayName) {
    return displayName
  }

  return resolveEmailPrefixPublicName(readStringField(owner, 'email')) ?? 'User'
}

export function resolvePublicOwnerAvatarUrl(
  owner: PublicOwnerProfileInput | null | undefined,
  options: MapPublicOwnerProjectionOptions = {},
) {
  const avatarUrl = readStringField(owner, 'avatarUrl')

  if (avatarUrl && isSafePublicUrl(avatarUrl)) {
    return avatarUrl
  }

  const avatarFileName = readStringField(owner, 'avatar')

  return avatarFileName && options.resolveAvatarUrl ? options.resolveAvatarUrl(avatarFileName) : null
}

export function resolvePublicOwnerInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || 'U'
}

export function mapPublicOwnerProjection(
  owner: PublicOwnerProfileInput | null | undefined,
  options: MapPublicOwnerProjectionOptions = {},
): PublicOwnerProjection {
  const displayName = resolvePublicOwnerDisplayName(owner)

  return {
    avatarUrl: resolvePublicOwnerAvatarUrl(owner, options),
    displayName,
    initial: resolvePublicOwnerInitial(displayName),
  }
}

export function getPublicOwnerAvatarPresentation(owner: PublicOwnerProjection): PublicOwnerAvatarPresentation {
  if (owner.avatarUrl) {
    return { kind: 'image', url: owner.avatarUrl }
  }

  return { initial: owner.initial, kind: 'gradient-initial' }
}

function resolveSafePublicName(value: string | null) {
  if (!value) {
    return null
  }

  return value.includes('@') ? resolveEmailPrefixPublicName(value) : value.trim()
}

function isSafePublicUrl(value: string) {
  if (value.startsWith('/')) {
    return true
  }

  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

function readStringField(record: Record<string, unknown> | null | undefined, field: string) {
  if (!record) {
    return null
  }

  const value = record[field]

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}
