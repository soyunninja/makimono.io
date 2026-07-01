import { itemCategories, itemStatuses, type Category, type InterestItem, type ItemStatus } from '@/features/items/types'

type JsonRpcRequest = {
  id?: unknown
  jsonrpc?: unknown
  method?: unknown
  params?: unknown
}

type JsonObject = Record<string, unknown>

type PocketBaseAuthResponse = {
  record?: unknown
}

type PocketBaseInterestRecord = {
  id: string
  category: unknown
  title: unknown
  status: unknown
  notes?: unknown
  tags?: unknown
  created: unknown
  deletedAt?: unknown
}

type PocketBaseListResponse = {
  items?: unknown
}

type RemoteMcpConfig = {
  authCollection: string
  pocketBaseUrl: string
}

export type RemoteMcpDependencies = {
  env?: Record<string, string | undefined>
  fetch?: typeof fetch
}

const interestsCollection = 'interests'
const defaultAuthCollection = 'users'
const hasOwn = Object.prototype.hasOwnProperty

const listTool = {
  name: 'makimono_list_interests',
  description: 'List PocketBase-backed Makimono interests for the authenticated user, optionally including deleted items and filtering by title, category, or tag.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      includeDeleted: { type: 'boolean' },
      query: { type: 'string' },
    },
  },
}

export async function handleRemoteMcpRequest(request: Request, dependencies: RemoteMcpDependencies = {}) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const token = getBearerToken(request.headers.get('Authorization'))

  if (!token) {
    return jsonResponse(jsonRpcError(null, -32001, 'Missing bearer token.'), 401)
  }

  let body: unknown

  try {
    body = await request.json()
  }
  catch {
    return jsonResponse(jsonRpcError(null, -32700, 'Invalid JSON request body.'), 400)
  }

  if (!isJsonRpcRequest(body)) {
    return jsonResponse(jsonRpcError(null, -32600, 'Invalid JSON-RPC request.'), 400)
  }

  const id = body.id ?? null
  const fetcher = dependencies.fetch ?? fetch
  let config: RemoteMcpConfig
  let auth: Awaited<ReturnType<typeof resolvePocketBaseUser>>

  try {
    config = getRemoteMcpConfig(dependencies.env)
    auth = await resolvePocketBaseUser({ config, fetcher, token })
  }
  catch {
    return jsonResponse(jsonRpcError(id, -32000, 'Remote MCP authentication could not be completed.'), 500)
  }

  if (!auth.ok) {
    return jsonResponse(jsonRpcError(id, -32001, 'Unauthorized.'), 401)
  }

  if (body.method === 'initialize') {
    return jsonResponse({
      id,
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2025-06-18',
        serverInfo: { name: 'makimono-remote-readonly', version: '0.1.0' },
        capabilities: { tools: {} },
      },
    })
  }

  if (body.method === 'tools/list') {
    return jsonResponse({ id, jsonrpc: '2.0', result: { tools: [listTool] } })
  }

  if (body.method === 'tools/call') {
    try {
      return jsonResponse(await handleToolCall({ config, fetcher, id, params: body.params, token, userId: auth.userId }))
    }
    catch {
      return jsonResponse(jsonRpcError(id, -32000, 'Remote MCP tool call failed.'), 500)
    }
  }

  return jsonResponse(jsonRpcError(id, -32601, 'Unsupported MCP method for this read-only slice.'))
}

function getBearerToken(header: string | null) {
  if (!header) {
    return null
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim())

  return match?.[1]?.trim() || null
}

function getRemoteMcpConfig(env = getProcessEnv()): RemoteMcpConfig {
  const pocketBaseUrl = (env.MAKIMONO_POCKETBASE_URL ?? env.VITE_POCKETBASE_URL)?.trim()
  const authCollection = env.MAKIMONO_POCKETBASE_AUTH_COLLECTION?.trim() || defaultAuthCollection

  if (!pocketBaseUrl) {
    throw new Error('Missing PocketBase URL for remote MCP. Set MAKIMONO_POCKETBASE_URL or VITE_POCKETBASE_URL.')
  }

  return {
    authCollection,
    pocketBaseUrl: pocketBaseUrl.replace(/\/+$/, ''),
  }
}

function getProcessEnv() {
  return typeof process === 'undefined' ? {} : process.env
}

async function resolvePocketBaseUser({ config, fetcher, token }: { config: RemoteMcpConfig, fetcher: typeof fetch, token: string }) {
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${encodeURIComponent(config.authCollection)}/auth-refresh`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  })

  if (!response.ok) {
    return { ok: false as const }
  }

  const body = await response.json() as PocketBaseAuthResponse
  const record = body.record

  if (!isRecord(record) || typeof record.id !== 'string' || record.id.trim().length === 0) {
    return { ok: false as const }
  }

  return { ok: true as const, userId: record.id }
}

async function handleToolCall({ config, fetcher, id, params, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  id: unknown
  params: unknown
  token: string
  userId: string
}) {
  if (!isRecord(params) || params.name !== listTool.name) {
    return jsonRpcError(id, -32601, 'Only makimono_list_interests is available on the remote read-only endpoint.')
  }

  const argumentsResult = parseListToolArguments(params.arguments)

  if (!argumentsResult.ok) {
    return jsonRpcError(id, -32602, argumentsResult.message)
  }

  const items = filterInterests(
    await listPocketBaseInterests({ config, fetcher, token, userId }),
    argumentsResult.arguments,
  )
  const output = { count: items.length, items }

  return {
    id,
    jsonrpc: '2.0',
    result: {
      content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    },
  }
}

function parseListToolArguments(value: unknown) {
  if (value === undefined) {
    return { ok: true as const, arguments: {} }
  }

  if (!isRecord(value)) {
    return { ok: false as const, message: 'makimono_list_interests arguments must be an object.' }
  }

  const allowedKeys = new Set(['includeDeleted', 'query'])

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false as const, message: `Unsupported makimono_list_interests argument: ${key}.` }
    }
  }

  if (value.includeDeleted !== undefined && typeof value.includeDeleted !== 'boolean') {
    return { ok: false as const, message: 'includeDeleted must be a boolean when provided.' }
  }

  if (value.query !== undefined && typeof value.query !== 'string') {
    return { ok: false as const, message: 'query must be a string when provided.' }
  }

  return {
    ok: true as const,
    arguments: {
      includeDeleted: value.includeDeleted,
      query: value.query?.trim(),
    },
  }
}

async function listPocketBaseInterests({ config, fetcher, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  token: string
  userId: string
}) {
  const searchParams = new URLSearchParams({
    filter: `user=${quotePocketBaseFilterValue(userId)}`,
    perPage: '200',
    sort: '-created',
  })
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${interestsCollection}/records?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`PocketBase list request failed with status ${response.status}.`)
  }

  const result = await response.json() as unknown

  if (!isRecord(result) || !Array.isArray((result as PocketBaseListResponse).items)) {
    throw new Error('PocketBase returned an invalid interests list response.')
  }

  return (result as { items: unknown[] }).items.map(mapPocketBaseRecord)
}

function quotePocketBaseFilterValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function mapPocketBaseRecord(record: unknown): InterestItem {
  if (!isPocketBaseInterestRecord(record) || !isString(record.id) || !isString(record.title) || !isString(record.created)) {
    throw new Error('PocketBase returned an invalid interest record.')
  }

  if (!isCategory(record.category) || !isItemStatus(record.status)) {
    throw new Error('PocketBase interest record contains an unsupported category or status.')
  }

  return {
    id: record.id,
    category: record.category,
    title: record.title,
    status: record.status,
    notes: isString(record.notes) && record.notes.trim().length > 0 ? record.notes : undefined,
    tags: isStringArray(record.tags) ? record.tags : [],
    createdAt: record.created,
    deletedAt: isString(record.deletedAt) && record.deletedAt.trim().length > 0 ? record.deletedAt : undefined,
  }
}

export function filterInterests(items: InterestItem[], options: { includeDeleted?: boolean, query?: string }) {
  const normalizedQuery = options.query?.trim().toLowerCase()

  return items.filter((item) => {
    if (!options.includeDeleted && item.deletedAt) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return [item.title, item.category, ...item.tags].some((value) => value.toLowerCase().includes(normalizedQuery))
  })
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return isRecord(value) && value.jsonrpc === '2.0' && typeof value.method === 'string'
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isCategory(value: unknown): value is Category {
  return itemCategories.includes(value as Category)
}

function isItemStatus(value: unknown): value is ItemStatus {
  return itemStatuses.includes(value as ItemStatus)
}

function isPocketBaseInterestRecord(value: unknown): value is PocketBaseInterestRecord {
  return isRecord(value) && hasOwn.call(value, 'id') && hasOwn.call(value, 'created')
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return { error: { code, message }, id, jsonrpc: '2.0' }
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status })
}
