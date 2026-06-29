import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getPocketBaseClient,
  getPocketBaseErrorMessage,
  isPocketBaseNotFoundError,
  PocketBaseClientResponseError,
} from '@/lib/pocketbase'
import { installMockLocalStorage } from '@/test/mock-local-storage'

const fetchMock = vi.fn<typeof fetch>()

function createPocketBaseToken(exp: number) {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp })}.signature`
}

function createFuturePocketBaseToken() {
  return createPocketBaseToken(Math.floor(Date.now() / 1000) + 60 * 60)
}

function createExpiredPocketBaseToken() {
  return createPocketBaseToken(Math.floor(Date.now() / 1000) - 60)
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  })
}

describe('minimal PocketBase REST client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_POCKETBASE_URL', `https://pocketbase.example.com/${crypto.randomUUID()}`)
    vi.stubGlobal('fetch', fetchMock)
    installMockLocalStorage()
    localStorage.clear()
    fetchMock.mockReset()
  })

  it('authenticates users over REST, persists auth, and notifies authStore subscribers', async () => {
    const token = createFuturePocketBaseToken()
    fetchMock.mockResolvedValueOnce(jsonResponse({
      record: { email: 'mariano@example.com', id: 'user-1' },
      token,
    }))
    const client = getPocketBaseClient()
    const onChange = vi.fn()

    client?.authStore.onChange(onChange)
    await client?.collection('users').authWithPassword('mariano@example.com', 'super-secret')

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/pocketbase\.example\.com\/.+\/api\/collections\/users\/auth-with-password$/), expect.objectContaining({
      body: JSON.stringify({ identity: 'mariano@example.com', password: 'super-secret' }),
      method: 'POST',
    }))
    expect(client?.authStore.token).toBe(token)
    expect(client?.authStore.model).toEqual({ email: 'mariano@example.com', id: 'user-1' })
    expect(client?.authStore.isValid).toBe(true)
    expect(onChange).toHaveBeenCalledWith(token, { email: 'mariano@example.com', id: 'user-1' })
    expect(JSON.parse(localStorage.getItem('pocketbase_auth') ?? '{}')).toEqual({
      model: { email: 'mariano@example.com', id: 'user-1' },
      token,
    })
  })

  it('loads persisted auth and clears it from localStorage', () => {
    const token = createFuturePocketBaseToken()
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      model: { email: 'persisted@example.com', id: 'user-persisted' },
      token,
    }))

    const client = getPocketBaseClient()
    const onChange = vi.fn()
    client?.authStore.onChange(onChange)

    expect(client?.authStore.token).toBe(token)
    expect(client?.authStore.model).toEqual({ email: 'persisted@example.com', id: 'user-persisted' })
    expect(client?.authStore.isValid).toBe(true)

    client?.authStore.clear()

    expect(client?.authStore.token).toBe('')
    expect(client?.authStore.model).toBeNull()
    expect(client?.authStore.isValid).toBe(false)
    expect(localStorage.getItem('pocketbase_auth')).toBeNull()
    expect(onChange).toHaveBeenCalledWith('', null)
  })

  it('uses PocketBase REST endpoints for record collections and bearer auth', async () => {
    const token = createFuturePocketBaseToken()
    localStorage.setItem('pocketbase_auth', JSON.stringify({ model: { id: 'user-1' }, token }))
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 'interest-1' }]))
      .mockResolvedValueOnce(jsonResponse({ id: 'interest-2' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'interest-3' }))
    const client = getPocketBaseClient()
    const interests = client?.collection('interests')

    await expect(interests?.getFullList({ sort: '-created' })).resolves.toEqual([{ id: 'interest-1' }])
    await expect(interests?.create({ title: 'Refactoring' })).resolves.toEqual({ id: 'interest-2' })
    await expect(interests?.update('interest-2', { title: 'Clean Architecture' })).resolves.toEqual({ id: 'interest-3' })

    expect(fetchMock.mock.calls[0]).toEqual([expect.stringMatching(/^https:\/\/pocketbase\.example\.com\/.+\/api\/collections\/interests\/records\?sort=-created&page=1&perPage=200&skipTotal=1$/), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      method: 'GET',
    })])
    expect(fetchMock.mock.calls[1]).toEqual([expect.stringMatching(/^https:\/\/pocketbase\.example\.com\/.+\/api\/collections\/interests\/records$/), expect.objectContaining({
      body: JSON.stringify({ title: 'Refactoring' }),
      method: 'POST',
    })])
    expect(fetchMock.mock.calls[2]).toEqual([expect.stringMatching(/^https:\/\/pocketbase\.example\.com\/.+\/api\/collections\/interests\/records\/interest-2$/), expect.objectContaining({
      body: JSON.stringify({ title: 'Clean Architecture' }),
      method: 'PATCH',
    })])
  })

  it('fetches every PocketBase list page while preserving sort order', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'interest-1' }], page: 1, perPage: 1, totalPages: 3 }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'interest-2' }], page: 2, perPage: 1, totalPages: 3 }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'interest-3' }], page: 3, perPage: 1, totalPages: 3 }))
    const client = getPocketBaseClient()

    await expect(client?.collection('interests').getFullList({ sort: '-created' })).resolves.toEqual([
      { id: 'interest-1' },
      { id: 'interest-2' },
      { id: 'interest-3' },
    ])

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringMatching(/\/api\/collections\/interests\/records\?sort=-created&page=1&perPage=200&skipTotal=1$/),
      expect.stringMatching(/\/api\/collections\/interests\/records\?sort=-created&page=2&perPage=200&skipTotal=1$/),
      expect.stringMatching(/\/api\/collections\/interests\/records\?sort=-created&page=3&perPage=200&skipTotal=1$/),
    ])
  })

  it('keeps fetching list pages when totalPages is omitted and the page is full', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: Array.from({ length: 200 }, (_, index) => ({ id: `interest-${index + 1}` })) }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'interest-201' }] }))
    const client = getPocketBaseClient()

    await expect(client?.collection('interests').getFullList()).resolves.toHaveLength(201)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringMatching(/\/api\/collections\/interests\/records\?page=1&perPage=200&skipTotal=1$/),
      expect.stringMatching(/\/api\/collections\/interests\/records\?page=2&perPage=200&skipTotal=1$/),
    ])
  })

  it('treats persisted auth with a future exp as valid', () => {
    const token = createFuturePocketBaseToken()
    localStorage.setItem('pocketbase_auth', JSON.stringify({ model: { id: 'user-1' }, token }))

    const client = getPocketBaseClient()

    expect(client?.authStore.isValid).toBe(true)
    expect(client?.authStore.token).toBe(token)
    expect(client?.authStore.model).toEqual({ id: 'user-1' })
  })

  it('clears persisted auth with an expired exp', () => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ model: { id: 'user-1' }, token: createExpiredPocketBaseToken() }))

    const client = getPocketBaseClient()

    expect(client?.authStore.isValid).toBe(false)
    expect(client?.authStore.token).toBe('')
    expect(client?.authStore.model).toBeNull()
    expect(localStorage.getItem('pocketbase_auth')).toBeNull()
  })

  it('clears persisted auth with a malformed token', () => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ model: { id: 'user-1' }, token: 'not-a-jwt' }))

    const client = getPocketBaseClient()

    expect(client?.authStore.isValid).toBe(false)
    expect(client?.authStore.token).toBe('')
    expect(client?.authStore.model).toBeNull()
    expect(localStorage.getItem('pocketbase_auth')).toBeNull()
  })

  it('treats persisted auth with a missing token or model as unauthenticated', () => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ model: { id: 'user-1' } }))

    const clientWithoutToken = getPocketBaseClient()

    expect(clientWithoutToken?.authStore.isValid).toBe(false)
    expect(clientWithoutToken?.authStore.model).toBeNull()

    vi.stubEnv('VITE_POCKETBASE_URL', `https://pocketbase.example.com/${crypto.randomUUID()}`)
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: createFuturePocketBaseToken() }))

    const clientWithoutModel = getPocketBaseClient()

    expect(clientWithoutModel?.authStore.isValid).toBe(false)
    expect(clientWithoutModel?.authStore.token).toBe('')
  })

  it('keeps PocketBase error helper behavior without the official SDK', () => {
    const error = new PocketBaseClientResponseError(404, {
      data: { email: { message: 'Invalid email.' } },
      message: 'Request failed.',
    })

    expect(isPocketBaseNotFoundError(error)).toBe(true)
    expect(getPocketBaseErrorMessage(error, 'Fallback')).toBe('Request failed.')
  })
})
