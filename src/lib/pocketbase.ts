type PocketBaseErrorResponseData = {
  data?: unknown
  message?: unknown
}

type PocketBaseAuthChangeCallback = (token: string, model: PocketBaseAuthRecord | null) => void

type PocketBaseAuthStorageData = {
  model?: unknown
  record?: unknown
  token?: unknown
}

type PocketBaseRequestOptions = {
  body?: unknown
  method?: 'GET' | 'POST' | 'PATCH'
}

type PocketBaseListResponse = {
  items: unknown[]
  page?: unknown
  perPage?: unknown
  totalPages?: unknown
}

type PocketBaseJwtPayload = {
  exp?: unknown
}

const authStorageKey = 'pocketbase_auth'
const fullListPerPage = 200
const hasOwn = Object.prototype.hasOwnProperty

let cachedPocketBaseUrl: string | null = null
let cachedPocketBaseClient: MinimalPocketBaseClient | null = null

export type PocketBaseAuthRecord = Record<string, unknown> & { email?: string, id: string }

export class PocketBaseClientResponseError extends Error {
  readonly response: unknown
  readonly status: number

  constructor(status: number, response: unknown, message?: string) {
    super(message ?? getResponseMessage(response) ?? `PocketBase request failed with status ${status}.`)
    this.name = 'ClientResponseError'
    this.response = response
    this.status = status
  }
}

class MinimalPocketBaseAuthStore {
  #callbacks = new Set<PocketBaseAuthChangeCallback>()
  #model: PocketBaseAuthRecord | null = null
  #token = ''

  constructor() {
    this.#loadFromStorage()
  }

  get isValid() {
    return this.#token.length > 0 && this.#model !== null && isPocketBaseTokenValid(this.#token)
  }

  get model() {
    return this.#model
  }

  get record() {
    return this.#model
  }

  get token() {
    return this.#token
  }

  clear() {
    this.#token = ''
    this.#model = null
    getBrowserLocalStorage()?.removeItem(authStorageKey)
    this.#notify()
  }

  onChange(callback: PocketBaseAuthChangeCallback) {
    this.#callbacks.add(callback)

    return () => {
      this.#callbacks.delete(callback)
    }
  }

  save(token: string, model: PocketBaseAuthRecord | null) {
    const hasValidAuth = token.length > 0 && model !== null && isPocketBaseTokenValid(token)

    this.#token = hasValidAuth ? token : ''
    this.#model = hasValidAuth ? model : null

    if (hasValidAuth) {
      getBrowserLocalStorage()?.setItem(authStorageKey, JSON.stringify({ token, model }))
    }
    else {
      getBrowserLocalStorage()?.removeItem(authStorageKey)
    }

    this.#notify()
  }

  #loadFromStorage() {
    const storedAuth = getBrowserLocalStorage()?.getItem(authStorageKey)

    if (!storedAuth) {
      return
    }

    try {
      const parsedAuth = JSON.parse(storedAuth) as PocketBaseAuthStorageData
      const model = parsedAuth.model ?? parsedAuth.record

      if (typeof parsedAuth.token === 'string' && isPocketBaseAuthRecord(model)) {
        if (!isPocketBaseTokenValid(parsedAuth.token)) {
          getBrowserLocalStorage()?.removeItem(authStorageKey)
          return
        }

        this.#token = parsedAuth.token
        this.#model = model
      }
    }
    catch {
      getBrowserLocalStorage()?.removeItem(authStorageKey)
    }
  }

  #notify() {
    for (const callback of this.#callbacks) {
      callback(this.#token, this.#model)
    }
  }
}

class MinimalPocketBaseClient {
  readonly authStore = new MinimalPocketBaseAuthStore()

  constructor(private readonly baseUrl: string) {}

  collection(name: string) {
    return {
      authWithPassword: async (email: string, password: string) => {
        const response = await this.#request<{ record?: unknown, token?: unknown }>(`/api/collections/${encodeURIComponent(name)}/auth-with-password`, {
          body: { identity: email, password },
          method: 'POST',
        })

        if (typeof response.token !== 'string' || !isPocketBaseAuthRecord(response.record)) {
          throw new Error('Invalid PocketBase auth response.')
        }

        this.authStore.save(response.token, response.record)

        return response
      },
      create: (data: Record<string, unknown>) => this.#request(`/api/collections/${encodeURIComponent(name)}/records`, {
        body: data,
        method: 'POST',
      }),
      getFullList: async (options?: { sort?: string }): Promise<unknown[]> => {
        const items: unknown[] = []
        let page = 1

        while (true) {
          const searchParams = new URLSearchParams()

          if (options?.sort) {
            searchParams.set('sort', options.sort)
          }

          searchParams.set('page', String(page))
          searchParams.set('perPage', String(fullListPerPage))
          searchParams.set('skipTotal', '1')

          const response = await this.#request<unknown>(`/api/collections/${encodeURIComponent(name)}/records?${searchParams.toString()}`, { method: 'GET' })

          if (Array.isArray(response)) {
            return response
          }

          if (!isPocketBaseListResponse(response)) {
            throw new Error('Invalid PocketBase list response.')
          }

          items.push(...response.items)

          const totalPages = getPositiveInteger(response.totalPages)

          if (totalPages !== null) {
            if (page >= totalPages) {
              return items
            }
          }
          else if (response.items.length < fullListPerPage) {
            return items
          }

          page += 1
        }
      },
      update: (id: string, data: Record<string, unknown>) => this.#request(`/api/collections/${encodeURIComponent(name)}/records/${encodeURIComponent(id)}`, {
        body: data,
        method: 'PATCH',
      }),
    }
  }

  async #request<T>(path: string, options: PocketBaseRequestOptions): Promise<T> {
    const headers: Record<string, string> = {}

    if (this.authStore.token) {
      headers.Authorization = `Bearer ${this.authStore.token}`
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
      method: options.method ?? 'GET',
    })
    const responseBody = await parseResponseBody(response)

    if (!response.ok) {
      throw new PocketBaseClientResponseError(response.status, responseBody)
    }

    return responseBody as T
  }
}

export function getPocketBaseUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_POCKETBASE_URL?.trim()

  return configuredUrl ? configuredUrl.replace(/\/+$/, '') : null
}

export function isPocketBaseEnabled() {
  return getPocketBaseUrl() !== null
}

export function getPocketBaseClient(): MinimalPocketBaseClient | null {
  const pocketBaseUrl = getPocketBaseUrl()

  if (!pocketBaseUrl || typeof window === 'undefined') {
    return null
  }

  if (cachedPocketBaseClient && cachedPocketBaseUrl === pocketBaseUrl) {
    return cachedPocketBaseClient
  }

  cachedPocketBaseUrl = pocketBaseUrl
  cachedPocketBaseClient = new MinimalPocketBaseClient(pocketBaseUrl)

  return cachedPocketBaseClient
}

function getBrowserLocalStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function isPocketBaseAuthRecord(value: unknown): value is PocketBaseAuthRecord {
  return typeof value === 'object' && value !== null && hasOwn.call(value, 'id') && typeof (value as { id: unknown }).id === 'string'
}

function isPocketBaseErrorResponseData(value: unknown): value is PocketBaseErrorResponseData {
  return typeof value === 'object' && value !== null
}

function isPocketBaseListResponse(value: unknown): value is PocketBaseListResponse {
  return typeof value === 'object' && value !== null && hasOwn.call(value, 'items') && Array.isArray((value as { items: unknown }).items)
}

function getPositiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function isPocketBaseTokenValid(token: string) {
  const payload = decodeJwtPayload(token)

  if (!payload || typeof payload.exp !== 'number') {
    return false
  }

  return payload.exp * 1000 > Date.now()
}

function decodeJwtPayload(token: string): PocketBaseJwtPayload | null {
  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4), '=')
    const parsedPayload = JSON.parse(globalThis.atob(paddedPayload)) as unknown

    return typeof parsedPayload === 'object' && parsedPayload !== null ? parsedPayload : null
  }
  catch {
    return null
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  }
  catch {
    return text
  }
}

function getResponseMessage(response: unknown) {
  if (isPocketBaseErrorResponseData(response) && hasOwn.call(response, 'message') && typeof response.message === 'string' && response.message.trim().length > 0) {
    return response.message
  }

  return null
}

export function isPocketBaseNotFoundError(error: unknown) {
  return error instanceof PocketBaseClientResponseError && error.status === 404
}

export function getPocketBaseErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof PocketBaseClientResponseError) {
    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message
    }

    if (isPocketBaseErrorResponseData(error.response) && hasOwn.call(error.response, 'message') && typeof error.response.message === 'string' && error.response.message.trim().length > 0) {
      return error.response.message
    }

    if (isPocketBaseErrorResponseData(error.response) && hasOwn.call(error.response, 'data') && isPocketBaseErrorResponseData(error.response.data)) {
      for (const value of Object.values(error.response.data)) {
        if (
          isPocketBaseErrorResponseData(value)
          && hasOwn.call(value, 'message')
          && typeof value.message === 'string'
          && value.message.trim().length > 0
        ) {
          return value.message
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}
