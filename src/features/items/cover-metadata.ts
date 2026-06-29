import type { Category, CoverProvider, InterestItemCoverMetadata } from '@/features/items/types'

type CoverLookupEnvironment = {
  tmdbAccessToken?: string
  tmdbApiKey?: string
  rawgApiKey?: string
}

type CoverLookupResponse = {
  matchedTitle: string
  provider: CoverProvider
  imageUrl: string
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type ResolveInterestCoverMetadataOptions = {
  env?: CoverLookupEnvironment
  fetchFn?: FetchLike
}

export type ResolveInterestCoverMetadataInput = {
  category: Category
  title: string
  signal?: AbortSignal
}

export type InterestCoverResolver = (
  input: ResolveInterestCoverMetadataInput,
) => Promise<InterestItemCoverMetadata | null>

function readOptionalEnvValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function readCoverLookupEnvironment(): CoverLookupEnvironment {
  return {
    tmdbAccessToken: readOptionalEnvValue(import.meta.env.VITE_TMDB_ACCESS_TOKEN),
    tmdbApiKey: readOptionalEnvValue(import.meta.env.VITE_TMDB_API_KEY),
    rawgApiKey: readOptionalEnvValue(import.meta.env.VITE_RAWG_API_KEY),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeTitle(title: string): string {
  return title.trim()
}

function toCoverMetadata(result: CoverLookupResponse | null): InterestItemCoverMetadata | null {
  if (!result) {
    return null
  }

  return {
    coverImageUrl: result.imageUrl,
    coverProvider: result.provider,
    coverMatchedTitle: result.matchedTitle,
  }
}

async function fetchJson(fetchFn: FetchLike, url: string, init: RequestInit): Promise<unknown | null> {
  const response = await fetchFn(url, init)

  if (!response.ok) {
    return null
  }

  try {
    return await response.json() as unknown
  }
  catch {
    return null
  }
}

function getFirstTmdbPoster(data: unknown): CoverLookupResponse | null {
  if (!isRecord(data) || !Array.isArray(data.results)) {
    return null
  }

  for (const result of data.results) {
    if (!isRecord(result) || !isNonEmptyString(result.poster_path)) {
      continue
    }

    const matchedTitle = isNonEmptyString(result.name)
      ? result.name.trim()
      : isNonEmptyString(result.title)
        ? result.title.trim()
        : null

    if (!matchedTitle) {
      continue
    }

    return {
      matchedTitle,
      provider: 'tmdb',
      imageUrl: `https://image.tmdb.org/t/p/w780${result.poster_path}`,
    }
  }

  return null
}

async function resolveTmdbCoverMetadata(
  category: Extract<Category, 'series' | 'movies'>,
  title: string,
  signal: AbortSignal | undefined,
  env: CoverLookupEnvironment,
  fetchFn: FetchLike,
): Promise<CoverLookupResponse | null> {
  if (!env.tmdbAccessToken && !env.tmdbApiKey) {
    return null
  }

  const endpoint = category === 'series' ? 'tv' : 'movie'
  const url = new URL(`https://api.themoviedb.org/3/search/${endpoint}`)

  url.searchParams.set('query', title)
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('page', '1')
  url.searchParams.set('language', 'en-US')

  const headers = new Headers({ Accept: 'application/json' })

  if (env.tmdbAccessToken) {
    headers.set('Authorization', `Bearer ${env.tmdbAccessToken}`)
  }
  else if (env.tmdbApiKey) {
    url.searchParams.set('api_key', env.tmdbApiKey)
  }

  const data = await fetchJson(fetchFn, url.toString(), {
    headers,
    signal,
  })

  return getFirstTmdbPoster(data)
}

function getFirstRawgCover(data: unknown): CoverLookupResponse | null {
  if (!isRecord(data) || !Array.isArray(data.results)) {
    return null
  }

  for (const result of data.results) {
    if (!isRecord(result) || !isNonEmptyString(result.background_image) || !isNonEmptyString(result.name)) {
      continue
    }

    return {
      matchedTitle: result.name.trim(),
      provider: 'rawg',
      imageUrl: result.background_image.trim(),
    }
  }

  return null
}

async function resolveRawgCoverMetadata(
  title: string,
  signal: AbortSignal | undefined,
  env: CoverLookupEnvironment,
  fetchFn: FetchLike,
): Promise<CoverLookupResponse | null> {
  if (!env.rawgApiKey) {
    return null
  }

  const url = new URL('https://api.rawg.io/api/games')

  url.searchParams.set('key', env.rawgApiKey)
  url.searchParams.set('search', title)
  url.searchParams.set('page_size', '1')

  const data = await fetchJson(fetchFn, url.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  })

  return getFirstRawgCover(data)
}

function splitMusicTitle(title: string): { artist?: string; releaseTitle: string } {
  const separatorMatch = title.match(/\s+[—–-]\s+/u)

  if (!separatorMatch) {
    return { releaseTitle: title }
  }

  const [artist, releaseTitle] = title.split(separatorMatch[0], 2).map((part) => part.trim())

  if (!artist || !releaseTitle) {
    return { releaseTitle: title }
  }

  return { artist, releaseTitle }
}

function escapeMusicBrainzTerm(term: string): string {
  return term.replaceAll('"', '\\"')
}

function buildMusicBrainzQuery(title: string): string {
  const { artist, releaseTitle } = splitMusicTitle(title)

  if (artist) {
    return `artist:"${escapeMusicBrainzTerm(artist)}" AND releasegroup:"${escapeMusicBrainzTerm(releaseTitle)}"`
  }

  return `releasegroup:"${escapeMusicBrainzTerm(releaseTitle)}"`
}

function getMusicBrainzReleaseGroup(data: unknown): { id: string; matchedTitle: string } | null {
  if (!isRecord(data) || !Array.isArray(data['release-groups'])) {
    return null
  }

  for (const result of data['release-groups']) {
    if (!isRecord(result) || !isNonEmptyString(result.id) || !isNonEmptyString(result.title)) {
      continue
    }

    return {
      id: result.id.trim(),
      matchedTitle: result.title.trim(),
    }
  }

  return null
}

function getCoverArtArchiveImage(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.images)) {
    return null
  }

  for (const image of data.images) {
    if (!isRecord(image) || image.front !== true) {
      continue
    }

    if (isRecord(image.thumbnails)) {
      const preferredThumbnail = isNonEmptyString(image.thumbnails.large)
        ? image.thumbnails.large.trim()
        : isNonEmptyString(image.thumbnails.small)
          ? image.thumbnails.small.trim()
          : null

      if (preferredThumbnail) {
        return preferredThumbnail
      }
    }

    if (isNonEmptyString(image.image)) {
      return image.image.trim()
    }
  }

  return null
}

async function resolveMusicCoverMetadata(
  title: string,
  signal: AbortSignal | undefined,
  fetchFn: FetchLike,
): Promise<CoverLookupResponse | null> {
  const searchUrl = new URL('https://musicbrainz.org/ws/2/release-group')

  searchUrl.searchParams.set('fmt', 'json')
  searchUrl.searchParams.set('limit', '1')
  searchUrl.searchParams.set('query', buildMusicBrainzQuery(title))

  const searchResult = await fetchJson(fetchFn, searchUrl.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  })
  const releaseGroup = getMusicBrainzReleaseGroup(searchResult)

  if (!releaseGroup) {
    return null
  }

  const coverArtResult = await fetchJson(fetchFn, `https://coverartarchive.org/release-group/${releaseGroup.id}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  const imageUrl = getCoverArtArchiveImage(coverArtResult)

  if (!imageUrl) {
    return null
  }

  return {
    matchedTitle: releaseGroup.matchedTitle,
    provider: 'cover-art-archive',
    imageUrl,
  }
}

export async function resolveInterestCoverMetadata(
  input: ResolveInterestCoverMetadataInput,
  options: ResolveInterestCoverMetadataOptions = {},
): Promise<InterestItemCoverMetadata | null> {
  const normalizedTitle = normalizeTitle(input.title)

  if (normalizedTitle.length === 0) {
    return null
  }

  const env = options.env ?? readCoverLookupEnvironment()
  const fetchFn = options.fetchFn ?? fetch

  try {
    if (input.category === 'series' || input.category === 'movies') {
      return toCoverMetadata(await resolveTmdbCoverMetadata(input.category, normalizedTitle, input.signal, env, fetchFn))
    }

    if (input.category === 'games') {
      return toCoverMetadata(await resolveRawgCoverMetadata(normalizedTitle, input.signal, env, fetchFn))
    }

    if (input.category === 'music') {
      return toCoverMetadata(await resolveMusicCoverMetadata(normalizedTitle, input.signal, fetchFn))
    }

    return null
  }
  catch {
    return null
  }
}
