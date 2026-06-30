import type { Category, InterestItem, ItemStatus } from '@/features/items/types'

export const activeDashboardStatusOrder = ['in_progress', 'pending'] as const satisfies readonly ItemStatus[]

const activeDashboardStatuses = new Set<ItemStatus>(activeDashboardStatusOrder)

type RandomSource = () => number

export type OrderedDashboardCategorySection = {
  key: string
  category: Category
  items: InterestItem[]
}

function orderCategorySectionItemsByStatus(items: InterestItem[]): InterestItem[] {
  return [
    ...activeDashboardStatusOrder.flatMap((status) => (
      items.filter((item) => item.status === status)
    )),
    ...items.filter((item) => !activeDashboardStatuses.has(item.status)),
  ]
}

function shuffleItems(items: InterestItem[], random: RandomSource): InterestItem[] {
  const shuffledItems = [...items]

  for (let currentIndex = shuffledItems.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(random() * (currentIndex + 1))
    const currentItem = shuffledItems[currentIndex]
    const randomItem = shuffledItems[randomIndex]

    shuffledItems[currentIndex] = randomItem
    shuffledItems[randomIndex] = currentItem
  }

  return shuffledItems
}

export function groupActiveDashboardItemsByStatus(items: InterestItem[]): InterestItem[] {
  return activeDashboardStatusOrder.flatMap((status) => (
    items.filter((item) => item.status === status)
  ))
}

export function orderActiveDashboardItems(items: InterestItem[], random: RandomSource = Math.random): InterestItem[] {
  const activeItems = items.filter((item) => activeDashboardStatuses.has(item.status))

  return activeDashboardStatusOrder.flatMap((status) => (
    shuffleItems(
      activeItems.filter((item) => item.status === status),
      random,
    )
  ))
}

export function groupOrderedDashboardItemsByCategorySections(items: InterestItem[]): OrderedDashboardCategorySection[] {
  const sectionsByCategory = new Map<Category, OrderedDashboardCategorySection>()

  for (const item of items) {
    const existingSection = sectionsByCategory.get(item.category)

    if (existingSection) {
      existingSection.items.push(item)
      continue
    }

    sectionsByCategory.set(item.category, {
      category: item.category,
      items: [item],
      key: item.category,
    })
  }

  return Array.from(sectionsByCategory.values(), (section) => ({
    ...section,
    items: orderCategorySectionItemsByStatus(section.items),
  }))
}
