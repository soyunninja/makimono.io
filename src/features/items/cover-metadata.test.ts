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

  it('calls Open Library for books and returns cover metadata when cover artwork exists', async () => {
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse({
      docs: [{
        title: 'Clean Architecture',
        cover_i: 12345,
      }],
    }))

    await expect(resolveInterestCoverMetadata(
      { category: 'books', title: 'Clean Architecture' },
      { fetchFn },
    )).resolves.toEqual({
      coverImageUrl: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      coverMatchedTitle: 'Clean Architecture',
      coverProvider: 'open-library',
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    const [requestUrl, requestInit] = fetchFn.mock.calls[0] as [string, RequestInit]
    const url = new URL(requestUrl)

    expect(url.origin).toBe('https://openlibrary.org')
    expect(url.pathname).toBe('/search.json')
    expect(url.searchParams.get('title')).toBe('Clean Architecture')
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('fields')).toBe('title,title_suggest,cover_i')
    expect(requestInit.headers).toEqual({ Accept: 'application/json' })
  })

  it('returns null for books when Open Library has no cover artwork', async () => {
    const fetchFn = vi.fn().mockResolvedValue(createJsonResponse({
      docs: [{
        title: 'Clean Architecture',
      }],
    }))

    await expect(resolveInterestCoverMetadata(
      { category: 'books', title: 'Clean Architecture' },
      { fetchFn },
    )).resolves.toBeNull()
  })
})
