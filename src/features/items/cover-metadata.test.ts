import { describe, expect, it, vi } from 'vitest'

import { resolveInterestCoverMetadata } from '@/features/items/cover-metadata'

function createJsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('resolveInterestCoverMetadata', () => {
  it('skips provider fetches when the required API keys are absent', async () => {
    const fetchFn = vi.fn()

    await expect(resolveInterestCoverMetadata(
      { category: 'movies', title: 'Arrival' },
      { env: {}, fetchFn },
    )).resolves.toBeNull()

    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('builds a TMDB poster URL when a movie match includes poster artwork', async () => {
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse({
      results: [{
        title: 'Arrival',
        poster_path: '/poster.jpg',
      }],
    }))

    await expect(resolveInterestCoverMetadata(
      { category: 'movies', title: 'Arrival' },
      { env: { tmdbApiKey: 'test-key' }, fetchFn },
    )).resolves.toEqual({
      coverImageUrl: 'https://image.tmdb.org/t/p/w780/poster.jpg',
      coverMatchedTitle: 'Arrival',
      coverProvider: 'tmdb',
    })
  })

  it('returns null for books without making an external request', async () => {
    const fetchFn = vi.fn()

    await expect(resolveInterestCoverMetadata(
      { category: 'books', title: 'Clean Architecture' },
      { fetchFn },
    )).resolves.toBeNull()

    expect(fetchFn).not.toHaveBeenCalled()
  })
})
