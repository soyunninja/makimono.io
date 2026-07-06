import { describe, expect, it, vi } from 'vitest'

import {
  createFallbackPublicUserProfile,
  createPocketBasePublicUserProfileRepository,
  mapPocketBasePublicUserProfileRecord,
} from '@/features/auth/public-user-profile-repository'

describe('PocketBase public user profile repository', () => {
  it('reads the current avatar from the users record by username', async () => {
    const getFullList = vi.fn().mockResolvedValue([
      {
        avatar: 'avatar.webp',
        email: 'ana.private@example.com',
        id: 'user-current',
        username: 'ana',
      },
    ])
    const repository = createPocketBasePublicUserProfileRepository({
      collection: { getFullList },
      resolveAvatarUrl: (recordId, fileName) => `/api/files/users/${recordId}/${fileName}`,
    })

    await expect(repository.getByUsername(' Ana ')).resolves.toEqual({
      owner: {
        avatarUrl: '/api/files/users/user-current/avatar.webp',
        displayName: 'ana',
        initial: 'A',
      },
      ownerNamespace: 'ana',
    })
    expect(getFullList).toHaveBeenCalledWith({
      filter: 'username = "ana"',
      perPage: 1,
    })
  })

  it('maps only safe public profile data from a users record', () => {
    const profile = mapPocketBasePublicUserProfileRecord({
      avatar: 'avatar.webp',
      email: 'ana.private@example.com',
      id: 'user-current',
      passwordHash: 'secret',
      tokenKey: 'secret-token',
      username: 'ana',
    }, {
      resolveAvatarUrl: (recordId, fileName) => `/api/files/users/${recordId}/${fileName}`,
    })
    const serializedProfile = JSON.stringify(profile)

    expect(profile).toEqual({
      owner: {
        avatarUrl: '/api/files/users/user-current/avatar.webp',
        displayName: 'ana',
        initial: 'A',
      },
      ownerNamespace: 'ana',
    })
    expect(serializedProfile).not.toContain('ana.private@example.com')
    expect(serializedProfile).not.toContain('secret')
  })

  it('creates a no-avatar fallback without using list-level snapshots', () => {
    expect(createFallbackPublicUserProfile(' Ana ')).toEqual({
      owner: {
        avatarUrl: null,
        displayName: 'ana',
        initial: 'A',
      },
      ownerNamespace: 'ana',
    })
  })
})
