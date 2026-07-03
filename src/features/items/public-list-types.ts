import type { Category, CoverProvider } from '@/features/items/types'

export type PublicOwnerProjection = {
  displayName: string
  avatarUrl: string | null
  initial: string
}

export type PublicListItem = {
  id: string
  category: Category
  title: string
  notes?: string
  tags: string[]
  coverImageUrl?: string
  coverProvider?: CoverProvider
  coverMatchedTitle?: string
}

export type PublicList = {
  id: string
  owner: PublicOwnerProjection
  ownerNamespace: string
  slug: string
  title: string
  listDate: string
  description?: string
  items: PublicListItem[]
  publishedAt: string
  updatedAt?: string
}

export type PublicRoutePartNormalizationError = 'empty'

export type PublicRoutePartNormalizationResult =
  | { ok: true, value: string }
  | { error: PublicRoutePartNormalizationError, ok: false, value: '' }

export type PublicOwnerNamespaceInput = {
  email?: string | null
  username?: string | null
}

export function normalizePublicRoutePart(value: string): PublicRoutePartNormalizationResult {
  const normalizedValue = value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')

  if (normalizedValue.length === 0) {
    return { error: 'empty', ok: false, value: '' }
  }

  return { ok: true, value: normalizedValue }
}

export function normalizePublicListSlug(slug: string) {
  return normalizePublicRoutePart(slug)
}

export function normalizePublicOwnerNamespace(ownerNamespace: string) {
  return normalizePublicRoutePart(ownerNamespace)
}

export function derivePublicOwnerNamespace(input: PublicOwnerNamespaceInput): PublicRoutePartNormalizationResult {
  const username = input.username?.trim()

  if (username) {
    return normalizePublicOwnerNamespace(username)
  }

  const emailPrefix = input.email?.split('@')[0]?.trim() ?? ''

  return normalizePublicOwnerNamespace(emailPrefix)
}

export function clonePublicListItem(item: PublicListItem): PublicListItem {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    ...(item.notes !== undefined ? { notes: item.notes } : {}),
    tags: [...item.tags],
    ...(item.coverImageUrl !== undefined ? { coverImageUrl: item.coverImageUrl } : {}),
    ...(item.coverProvider !== undefined ? { coverProvider: item.coverProvider } : {}),
    ...(item.coverMatchedTitle !== undefined ? { coverMatchedTitle: item.coverMatchedTitle } : {}),
  }
}

export function clonePublicList(list: PublicList): PublicList {
  return {
    id: list.id,
    owner: { ...list.owner },
    ownerNamespace: list.ownerNamespace,
    slug: list.slug,
    title: list.title,
    listDate: list.listDate,
    ...(list.description !== undefined ? { description: list.description } : {}),
    items: list.items.map(clonePublicListItem),
    publishedAt: list.publishedAt,
    ...(list.updatedAt !== undefined ? { updatedAt: list.updatedAt } : {}),
  }
}
