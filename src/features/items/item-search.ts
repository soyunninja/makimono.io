import type { InterestItem } from '@/features/items/types'

function normalizeSearchQuery(query: string) {
  return query.trim().toLocaleLowerCase()
}

export function matchesItemSearchQuery(item: InterestItem, query: string) {
  const normalizedQuery = normalizeSearchQuery(query)

  if (normalizedQuery.length === 0) {
    return true
  }

  return [item.title, item.notes ?? '', ...item.tags].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  )
}

export function filterItemsBySearchQuery(items: InterestItem[], query: string) {
  return items.filter((item) => matchesItemSearchQuery(item, query))
}
