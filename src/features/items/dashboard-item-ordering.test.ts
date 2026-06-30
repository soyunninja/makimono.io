import { describe, expect, it, vi } from 'vitest'

import {
  groupActiveDashboardItemsByStatus,
  groupOrderedDashboardItemsByCategorySections,
  orderActiveDashboardItems,
} from '@/features/items/dashboard-item-ordering'
import { defaultMockItems } from '@/features/items/mock-repository'
import type { InterestItem } from '@/features/items/types'

function itemIds(items: InterestItem[]): string[] {
  return items.map((item) => item.id)
}

describe('dashboard item ordering', () => {
  it('places in-progress items before pending items and excludes completed items', () => {
    const orderedItems = orderActiveDashboardItems(defaultMockItems, () => 0)

    expect(itemIds(orderedItems)).toEqual([
      'book-atomic-habits',
      'series-severance',
      'music-modal-soul',
      'movie-arrival',
    ])
  })

  it('uses the provided random source only within each active status group', () => {
    const random = vi.fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)

    const orderedItems = orderActiveDashboardItems(defaultMockItems, random)

    expect(itemIds(orderedItems)).toEqual([
      'book-atomic-habits',
      'series-severance',
      'music-modal-soul',
      'movie-arrival',
    ])
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('can restore status grouping without reshuffling the current item order', () => {
    const currentItems: InterestItem[] = [
      defaultMockItems[0],
      defaultMockItems[1],
      defaultMockItems[3],
      {
        ...defaultMockItems[4],
        status: 'in_progress',
      },
    ]

    expect(itemIds(groupActiveDashboardItemsByStatus(currentItems))).toEqual([
      'series-severance',
      'book-atomic-habits',
      'music-modal-soul',
      'movie-arrival',
    ])
  })

  it('creates one category section per first occurrence and keeps status groups stable inside it', () => {
    const orderedItems: InterestItem[] = [
      {
        ...defaultMockItems[1],
        id: 'movie-pending-first',
        title: 'Movie Pending First',
      },
      defaultMockItems[0],
      {
        ...defaultMockItems[3],
        id: 'book-in-progress-first',
        title: 'Book In Progress First',
      },
      {
        ...defaultMockItems[3],
        id: 'book-pending-middle',
        title: 'Book Pending Middle',
        status: 'pending',
      },
      {
        ...defaultMockItems[3],
        id: 'book-in-progress-second',
        title: 'Book In Progress Second',
      },
      {
        ...defaultMockItems[1],
        id: 'movie-pending-second',
        title: 'Movie Pending Second',
      },
    ]

    const sections = groupOrderedDashboardItemsByCategorySections(orderedItems)

    expect(sections).toHaveLength(3)
    expect(sections.map((section) => section.category)).toEqual(['movies', 'series', 'books'])
    expect(sections.map((section) => section.key)).toEqual(['movies', 'series', 'books'])
    expect(itemIds(sections[0]!.items)).toEqual(['movie-pending-first', 'movie-pending-second'])
    expect(itemIds(sections[1]!.items)).toEqual(['series-severance'])
    expect(itemIds(sections[2]!.items)).toEqual([
      'book-in-progress-first',
      'book-in-progress-second',
      'book-pending-middle',
    ])
  })
})
