import { describe, expect, it } from 'vitest'

import {
  appendPublicListItemSnapshot,
  hasMatchingDashboardInterest,
  isMatchingPublicListDashboardItem,
  mapPublicListItemToCreateInterestItemInput,
  mapRichInterestFormValuesToPublicListItem,
} from '@/features/items/public-list-item-mapper'
import type { PublicListItem } from '@/features/items/public-list-types'
import { createMockInterestRepository } from '@/features/items/mock-repository'
import type { InterestItem } from '@/features/items/types'

describe('public-list-item-mapper', () => {
  it('maps rich composer values to trimmed public snapshots while preserving tags and cover metadata', () => {
    const snapshot = mapRichInterestFormValuesToPublicListItem({
      category: 'books',
      title: '  The Left Hand of Darkness  ',
      notes: '  Read the new edition.  ',
      tags: ['sci-fi', 'classic'],
      coverImageUrl: 'https://images.example.com/left-hand.jpg',
      coverMatchedTitle: 'The Left Hand of Darkness',
      coverProvider: 'open-library',
    })

    expect(snapshot).toEqual({
      id: 'public-list-only-books-the-left-hand-of-darkness',
      category: 'books',
      title: 'The Left Hand of Darkness',
      notes: 'Read the new edition.',
      tags: ['sci-fi', 'classic'],
      coverImageUrl: 'https://images.example.com/left-hand.jpg',
      coverMatchedTitle: 'The Left Hand of Darkness',
      coverProvider: 'open-library',
    })
  })

  it('generates stable suffixes for repeated list-only snapshot ids', () => {
    const existingItems: PublicListItem[] = [
      { id: 'public-list-only-movies-arrival', category: 'movies', title: 'Arrival', tags: [] },
      { id: 'public-list-only-movies-arrival-2', category: 'movies', title: 'Arrival', tags: [] },
    ]

    expect(mapRichInterestFormValuesToPublicListItem({ category: 'movies', title: 'Arrival', tags: [] }, existingItems).id)
      .toBe('public-list-only-movies-arrival-3')
  })

  it('maps public snapshots to dashboard create input and repository-created pending interests', async () => {
    const publicItem: PublicListItem = {
      id: 'public-list-only-series-severance',
      category: 'series',
      title: '  Severance  ',
      notes: '  Watch with friends.  ',
      tags: ['office'],
      coverImageUrl: 'https://images.example.com/severance.jpg',
      coverMatchedTitle: 'Severance',
      coverProvider: 'tmdb',
    }
    const input = mapPublicListItemToCreateInterestItemInput(publicItem)

    expect(input).toEqual({
      category: 'series',
      title: 'Severance',
      notes: 'Watch with friends.',
      tags: ['office'],
      coverImageUrl: 'https://images.example.com/severance.jpg',
      coverMatchedTitle: 'Severance',
      coverProvider: 'tmdb',
    })

    await expect(createMockInterestRepository([]).createItem(input)).resolves.toMatchObject({
      status: 'pending',
      title: 'Severance',
    })
  })

  it('detects duplicates by category, normalized title, notes, tags, and cover metadata', () => {
    const publicItem: PublicListItem = {
      id: 'public-list-only-music-modal-soul',
      category: 'music',
      title: 'Nujabes — Modal Soul',
      notes: 'Focus album',
      tags: ['Jazz-Hop', 'Spotify'],
      coverImageUrl: 'https://images.example.com/modal-soul.jpg',
      coverMatchedTitle: 'Modal Soul',
      coverProvider: 'cover-art-archive',
    }
    const dashboardItem: InterestItem = {
      id: 'music-modal-soul',
      category: 'music',
      title: '  nujabes — modal soul  ',
      status: 'pending',
      notes: ' focus album ',
      tags: ['spotify', 'jazz-hop'],
      createdAt: '2026-07-03T00:00:00.000Z',
      coverImageUrl: 'https://images.example.com/modal-soul.jpg',
      coverMatchedTitle: ' modal soul ',
      coverProvider: 'cover-art-archive',
    }

    expect(isMatchingPublicListDashboardItem(publicItem, dashboardItem)).toBe(true)
    expect(hasMatchingDashboardInterest(publicItem, [dashboardItem])).toBe(true)
    expect(isMatchingPublicListDashboardItem(publicItem, { ...dashboardItem, coverImageUrl: 'https://images.example.com/other.jpg' })).toBe(false)
    expect(isMatchingPublicListDashboardItem(publicItem, { ...dashboardItem, category: 'podcasts' })).toBe(false)
  })

  it('preserves existing interest snapshot mapping and duplicate id behavior', () => {
    const item: InterestItem = {
      id: 'game-celeste',
      category: 'games',
      title: 'Celeste',
      status: 'completed',
      tags: ['platformer'],
      createdAt: '2026-07-03T00:00:00.000Z',
      coverImageUrl: 'https://images.example.com/celeste.jpg',
      coverMatchedTitle: 'Celeste',
      coverProvider: 'rawg',
    }
    const items = appendPublicListItemSnapshot([{
      id: 'game-celeste',
      category: 'games',
      title: 'Celeste',
      tags: ['platformer'],
    }], item)

    expect(items).toHaveLength(1)
    expect(items[0].coverImageUrl).toBeUndefined()
  })
})
