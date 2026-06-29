import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase'

type PocketBaseErrorResponseData = {
  data?: unknown
  message?: unknown
}

const hasOwn = Object.prototype.hasOwnProperty

let cachedPocketBaseUrl: string | null = null
let cachedPocketBaseClient: PocketBase | null = null

export type PocketBaseAuthRecord = RecordModel

export function getPocketBaseUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_POCKETBASE_URL?.trim()

  return configuredUrl ? configuredUrl : null
}

export function isPocketBaseEnabled() {
  return getPocketBaseUrl() !== null
}

export function getPocketBaseClient(): PocketBase | null {
  const pocketBaseUrl = getPocketBaseUrl()

  if (!pocketBaseUrl || typeof window === 'undefined') {
    return null
  }

  if (cachedPocketBaseClient && cachedPocketBaseUrl === pocketBaseUrl) {
    return cachedPocketBaseClient
  }

  cachedPocketBaseUrl = pocketBaseUrl
  cachedPocketBaseClient = new PocketBase(pocketBaseUrl)

  return cachedPocketBaseClient
}

function isPocketBaseErrorResponseData(value: unknown): value is PocketBaseErrorResponseData {
  return typeof value === 'object' && value !== null
}

export function isPocketBaseNotFoundError(error: unknown) {
  return error instanceof ClientResponseError && error.status === 404
}

export function getPocketBaseErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ClientResponseError) {
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
