import { clonePublicListItem, type PublicListItem } from '@/features/items/public-list-types'
import type { InterestItem } from '@/features/items/types'

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
