import { describe, expect, it, vi } from 'vitest'

import {
  mapAuthRecordToUserPublicProfile,
  normalizeUsername,
  validateUsername,
  type UserPublicProfile,
} from '@/features/auth/public-profile'
import type { PocketBaseAuthRecord } from '@/lib/pocketbase'

describe('public profile boundary', () => {
  it('maps only the public username and avatar URL representation from an auth record', () => {
    const profile = mapAuthRecordToUserPublicProfile(createPrivateAuthRecord(), {
      resolveAvatarUrl: (avatarFileName) => `/api/files/users/user-private/${avatarFileName}`,
    })

    const expectedProfile = {
      avatarUrl: '/api/files/users/user-private/avatar.webp',
      username: 'mariano',
    } satisfies UserPublicProfile

    expect(profile).toEqual(expectedProfile)
    expect(Object.keys(profile ?? {}).sort()).toEqual(['avatarUrl', 'username'])
  })

  it('does not expose private auth fields, future profile fields, list-sharing data, or metadata', () => {
    const profile = mapAuthRecordToUserPublicProfile(createPrivateAuthRecord())

    expect(profile).toEqual({
      avatarUrl: null,
      username: 'mariano',
    })
    expect(profile).not.toHaveProperty('email')
    expect(profile).not.toHaveProperty('id')
    expect(profile).not.toHaveProperty('bio')
    expect(profile).not.toHaveProperty('displayName')
    expect(profile).not.toHaveProperty('sharedLists')
    expect(profile).not.toHaveProperty('collectionId')
    expect(profile).not.toHaveProperty('collectionName')
  })

  it('does not treat non-string avatar metadata as a public avatar representation', () => {
    const resolveAvatarUrl = vi.fn((avatarFileName: string) => `/files/${avatarFileName}`)
    const profile = mapAuthRecordToUserPublicProfile({
      avatar: { filename: 'avatar.webp', size: 42 },
      id: 'user-private',
      username: 'mariano',
    }, { resolveAvatarUrl })

    expect(profile).toEqual({ avatarUrl: null, username: 'mariano' })
    expect(resolveAvatarUrl).not.toHaveBeenCalled()
  })

  it('normalizes and validates username handles before exposing them', () => {
    expect(normalizeUsername('  Mariano_99  ')).toBe('mariano_99')
    expect(validateUsername('Mariano_99')).toEqual({ ok: true, username: 'mariano_99' })
    expect(validateUsername('ab')).toEqual({ error: 'too_short', ok: false, username: 'ab' })
    expect(validateUsername('a'.repeat(31))).toEqual({ error: 'too_long', ok: false, username: 'a'.repeat(31) })
    expect(validateUsername('display name')).toEqual({ error: 'invalid_format', ok: false, username: 'display name' })
  })
})

function createPrivateAuthRecord(): PocketBaseAuthRecord {
  return {
    avatar: 'avatar.webp',
    bio: 'Private biography should not become public in this slice.',
    collectionId: '_pb_users_auth_',
    collectionName: 'users',
    displayName: 'Mariano Display',
    email: 'mariano@example.com',
    emailVisibility: false,
    id: 'user-private',
    metadata: { provider: 'password' },
    sharedLists: [{ id: 'list-1', visibility: 'public' }],
    username: '  Mariano  ',
    verified: true,
  }
}
