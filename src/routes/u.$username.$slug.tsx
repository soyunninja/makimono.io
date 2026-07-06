import { createFileRoute } from '@tanstack/react-router'

import {
  createFallbackPublicUserProfile,
  createPocketBasePublicUserProfileRepository,
  type PublicUserProfileRepository,
} from '@/features/auth/public-user-profile-repository'
import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import { PublicListPage } from '@/features/items/public-list-page'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { getPocketBaseClient, getPocketBaseFileUrl } from '@/lib/pocketbase'

type PublicListRouteParams = { slug: string, username: string }

export const Route = createFileRoute('/u/$username/$slug')({
  component: PublicListRoutePage,
  loader: ({ params }) => loadPublicListRoute(params),
})

export async function loadPublicListRoute(
  params: PublicListRouteParams,
  repository: PublicListRepository | null = createRuntimePublicListRepository(),
  publicUserProfileRepository: PublicUserProfileRepository | null = createRuntimePublicUserProfileRepository(),
): Promise<PublicList | null> {
  if (!repository) {
    return null
  }

  const list = await repository.getByOwnerAndSlug(params.username, params.slug)

  if (!list) {
    return null
  }

  const publicUserProfile = await publicUserProfileRepository?.getByUsername(params.username)
  const profileOwner = publicUserProfile ?? createFallbackPublicUserProfile(params.username)

  if (!profileOwner) {
    return list
  }

  return {
    ...list,
    owner: { ...profileOwner.owner },
    ownerNamespace: profileOwner.ownerNamespace,
  }
}

function PublicListRoutePage() {
  const list = Route.useLoaderData()

  return <PublicListPage list={list} />
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
