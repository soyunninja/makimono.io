import { createFileRoute } from '@tanstack/react-router'

import {
  createFallbackPublicUserProfile,
  createPocketBasePublicUserProfileRepository,
  type PublicUserProfileRepository,
} from '@/features/auth/public-user-profile-repository'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import { PublicProfilePage } from '@/features/items/public-profile-page'
import type { PublicOwnerProfile, PublicListRepository } from '@/features/items/public-list-repository'
import { getPocketBaseClient, getPocketBaseFileUrl } from '@/lib/pocketbase'

type PublicProfileRouteParams = { username: string }

export const Route = createFileRoute('/u/$username/')({
  component: PublicProfileRoutePage,
  loader: ({ params }) => loadPublicProfileRoute(params),
})

export async function loadPublicProfileRoute(
  params: PublicProfileRouteParams,
  repository: PublicListRepository | null = createRuntimePublicListRepository(),
  publicUserProfileRepository: PublicUserProfileRepository | null = createRuntimePublicUserProfileRepository(),
): Promise<PublicOwnerProfile | null> {
  const [listProfile, publicUserProfile] = await Promise.all([
    repository?.listByOwner(params.username) ?? null,
    publicUserProfileRepository?.getByUsername(params.username) ?? null,
  ])
  const fallbackProfile = createFallbackPublicUserProfile(params.username)
  const profileOwner = publicUserProfile ?? fallbackProfile

  if (!profileOwner || (!listProfile && !publicUserProfile)) {
    return null
  }

  return {
    lists: (listProfile?.lists ?? []).map((list) => ({
      ...list,
      owner: { ...profileOwner.owner },
      ownerNamespace: profileOwner.ownerNamespace,
    })),
    owner: { ...profileOwner.owner },
    ownerNamespace: profileOwner.ownerNamespace,
  }
}

function PublicProfileRoutePage() {
  const profile = Route.useLoaderData()

  return <PublicProfilePage profile={profile} />
}

function createRuntimePublicListRepository(): PublicListRepository | null {
  const client = getPocketBaseClient()

  if (!client) {
    return null
  }

  return createPocketBasePublicListRepository({ collection: client.collection('public_lists'), ownerId: '' })
}

function createRuntimePublicUserProfileRepository(): PublicUserProfileRepository | null {
  const client = getPocketBaseClient()

  if (!client) {
    return null
  }

  return createPocketBasePublicUserProfileRepository({
    collection: client.collection('users'),
    resolveAvatarUrl: (recordId, fileName) => getPocketBaseFileUrl('users', recordId, fileName),
  })
}
