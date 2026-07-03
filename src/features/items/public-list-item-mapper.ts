import type { RichInterestFormValues } from '@/features/items/add-flow'
import { clonePublicListItem, normalizePublicRoutePart, type PublicListItem } from '@/features/items/public-list-types'
import type { CreateInterestItemInput, InterestItem } from '@/features/items/types'

export function mapInterestItemToPublicListItem(item: InterestItem): PublicListItem {
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

export function appendPublicListItemSnapshot(items: PublicListItem[], item: InterestItem): PublicListItem[] {
  if (items.some((currentItem) => currentItem.id === item.id)) {
    return items.map(clonePublicListItem)
  }

  return [...items.map(clonePublicListItem), mapInterestItemToPublicListItem(item)]
}

export function mapRichInterestFormValuesToPublicListItem(values: RichInterestFormValues, items: PublicListItem[] = []): PublicListItem {
  const title = values.title.trim()
  const notes = values.notes?.trim()

  return {
    id: createListOnlyPublicItemId(items, values.category, title),
    category: values.category,
    title,
    ...(notes ? { notes } : {}),
    tags: [...values.tags],
    ...(values.coverImageUrl !== undefined ? { coverImageUrl: values.coverImageUrl } : {}),
    ...(values.coverProvider !== undefined ? { coverProvider: values.coverProvider } : {}),
    ...(values.coverMatchedTitle !== undefined ? { coverMatchedTitle: values.coverMatchedTitle } : {}),
  }
}

export function mapPublicListItemToCreateInterestItemInput(item: PublicListItem): CreateInterestItemInput {
  return {
    category: item.category,
    title: item.title.trim(),
    ...(item.notes !== undefined && item.notes.trim() ? { notes: item.notes.trim() } : {}),
    tags: [...item.tags],
    ...(item.coverImageUrl !== undefined ? { coverImageUrl: item.coverImageUrl } : {}),
    ...(item.coverProvider !== undefined ? { coverProvider: item.coverProvider } : {}),
    ...(item.coverMatchedTitle !== undefined ? { coverMatchedTitle: item.coverMatchedTitle } : {}),
  }
}

export function isMatchingPublicListDashboardItem(publicItem: PublicListItem, dashboardItem: InterestItem): boolean {
  return publicItem.category === dashboardItem.category
    && normalizeComparableText(publicItem.title) === normalizeComparableText(dashboardItem.title)
    && normalizeComparableText(publicItem.notes) === normalizeComparableText(dashboardItem.notes)
    && areComparableTagsEqual(publicItem.tags, dashboardItem.tags)
    && normalizeComparableText(publicItem.coverImageUrl) === normalizeComparableText(dashboardItem.coverImageUrl)
    && publicItem.coverProvider === dashboardItem.coverProvider
    && normalizeComparableText(publicItem.coverMatchedTitle) === normalizeComparableText(dashboardItem.coverMatchedTitle)
}

export function hasMatchingDashboardInterest(publicItem: PublicListItem, dashboardItems: InterestItem[]): boolean {
  return dashboardItems.some((dashboardItem) => isMatchingPublicListDashboardItem(publicItem, dashboardItem))
}

function createListOnlyPublicItemId(items: PublicListItem[], category: RichInterestFormValues['category'], title: string) {
  const normalizedTitle = normalizePublicRoutePart(title)
  const baseId = `public-list-only-${category}-${normalizedTitle.ok ? normalizedTitle.value : 'item'}`
  const existingIds = new Set(items.map((item) => item.id))

  if (!existingIds.has(baseId)) {
    return baseId
  }

  let suffix = 2

  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1
  }

  return `${baseId}-${suffix}`
}

function normalizeComparableText(value: string | undefined) {
  return value?.trim().toLocaleLowerCase() ?? ''
}

function normalizeComparableTags(tags: string[]) {
  return tags.map((tag) => normalizeComparableText(tag)).filter(Boolean).sort()
}

function areComparableTagsEqual(leftTags: string[], rightTags: string[]) {
  const left = normalizeComparableTags(leftTags)
  const right = normalizeComparableTags(rightTags)

  return left.length === right.length && left.every((tag, index) => tag === right[index])
}
