import { createFileRoute } from '@tanstack/react-router'

import { createPocketBasePublicListRepository } from '@/features/items/pocketbase-public-list-repository'
import { PublicListPage } from '@/features/items/public-list-page'
import type { PublicList } from '@/features/items/public-list-types'
import type { PublicListRepository } from '@/features/items/public-list-repository'
import { getPocketBaseClient, getPocketBaseFileUrl } from '@/lib/pocketbase'

type PublicListRouteParams = { slug: string, username: string }

export const Route = createFileRoute('/u/$username/lista/$slug')({
  component: PublicListRoutePage,
  loader: ({ params }) => loadPublicListRoute(params),
})

export async function loadPublicListRoute(
  params: PublicListRouteParams,
  repository: PublicListRepository | null = createRuntimePublicListRepository(),
): Promise<PublicList | null> {
  if (!repository) {
    return null
  }

  return repository.getByOwnerAndSlug(params.username, params.slug)
}

export function PublicListRoutePage() {
  const list = Route.useLoaderData()

  return <PublicListPage list={list} />
}

function createRuntimePublicListRepository(): PublicListRepository | null {
  const client = getPocketBaseClient()

  if (!client) {
    return null
  }

  return createPocketBasePublicListRepository({ collection: client.collection('public_lists'), ownerId: '', resolveOwnerAvatarUrl: (recordId, fileName) => getPocketBaseFileUrl('public_lists', recordId, fileName) })
}
