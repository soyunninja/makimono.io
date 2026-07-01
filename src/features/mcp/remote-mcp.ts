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
  auditCollection: string
  authCollection: string
  enableWrites: boolean
  pocketBaseUrl: string
  writeLimitPerMinute: number
}

type RemoteMcpAuditEvent = {
  action: 'create' | 'update' | 'update_status'
  clientLabel?: string
  outcome: 'success'
  requestId?: string
  summary: JsonObject
  targetCollection: typeof interestsCollection
  targetId: string
  timestamp: string
  toolName: 'makimono_create_interest' | 'makimono_update_interest' | 'makimono_update_interest_status'
  userId: string
}

type RemoteMcpWriteLimiter = {
  consume: (userId: string, limit: number, now: number) => boolean
}

export type RemoteMcpDependencies = {
  auditSink?: (event: RemoteMcpAuditEvent) => void | Promise<void>
  env?: Record<string, string | undefined>
  fetch?: typeof fetch
  now?: () => number
  writeLimiter?: RemoteMcpWriteLimiter
}

const interestsCollection = 'interests'
const defaultAuditCollection = 'remote_mcp_audit_events'
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

const createTool = {
  name: 'makimono_create_interest' as const,
  description: 'Create a pending PocketBase-backed Makimono interest for the authenticated user.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['category', 'title'],
    properties: {
      category: { enum: itemCategories, type: 'string' },
      notes: { type: 'string' },
      tags: { items: { type: 'string' }, type: 'array' },
      title: { type: 'string' },
    },
  },
}

const updateTool = {
  name: 'makimono_update_interest' as const,
  description: 'Edit a PocketBase-backed Makimono interest title, notes, or tags for the authenticated user.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: { type: 'string' },
      notes: { type: 'string' },
      tags: { items: { type: 'string' }, type: 'array' },
      title: { type: 'string' },
    },
  },
}

const updateStatusTool = {
  name: 'makimono_update_interest_status' as const,
  description: 'Update a PocketBase-backed Makimono interest status for the authenticated user.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'status'],
    properties: {
      id: { type: 'string' },
      status: { enum: itemStatuses, type: 'string' },
    },
  },
}

const defaultWriteLimiter = createInMemoryWriteLimiter()

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
    return jsonResponse({ id, jsonrpc: '2.0', result: { tools: config.enableWrites ? [listTool, createTool, updateTool, updateStatusTool] : [listTool] } })
  }

  if (body.method === 'tools/call') {
    try {
      return jsonResponse(await handleToolCall({
        auditSink: dependencies.auditSink ?? createPocketBaseAuditSink({ config, fetcher, token }),
        config,
        fetcher,
        id,
        now: dependencies.now ?? Date.now,
        params: body.params,
        token,
        userId: auth.userId,
        writeLimiter: dependencies.writeLimiter ?? defaultWriteLimiter,
      }))
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
  const writeLimitPerMinute = parsePositiveInteger(env.MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE, 5)

  if (!pocketBaseUrl) {
    throw new Error('Missing PocketBase URL for remote MCP. Set MAKIMONO_POCKETBASE_URL or VITE_POCKETBASE_URL.')
  }

  return {
    authCollection,
    auditCollection: env.MAKIMONO_REMOTE_MCP_AUDIT_COLLECTION?.trim() || defaultAuditCollection,
    enableWrites: env.MAKIMONO_REMOTE_MCP_ENABLE_WRITES === 'true',
    pocketBaseUrl: pocketBaseUrl.replace(/\/+$/, ''),
    writeLimitPerMinute,
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

async function handleToolCall({ auditSink, config, fetcher, id, now, params, token, userId, writeLimiter }: {
  auditSink: (event: RemoteMcpAuditEvent) => void | Promise<void>
  config: RemoteMcpConfig
  fetcher: typeof fetch
  id: unknown
  now: () => number
  params: unknown
  token: string
  userId: string
  writeLimiter: RemoteMcpWriteLimiter
}) {
  if (!isRecord(params)) {
    return jsonRpcError(id, -32602, 'MCP tool call params must be an object.')
  }

  if ((params.name === createTool.name || params.name === updateTool.name || params.name === updateStatusTool.name) && !config.enableWrites) {
    return jsonRpcError(id, -32601, `${params.name} is disabled for remote MCP. Set MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true to enable guarded remote writes.`)
  }

  if (params.name === createTool.name) {
    const argumentsResult = parseCreateToolArguments(params.arguments)

    if (!argumentsResult.ok) {
      return jsonRpcError(id, -32602, argumentsResult.message)
    }

    if (!writeLimiter.consume(userId, config.writeLimitPerMinute, now())) {
      return jsonRpcError(id, -32029, `Remote MCP write rate limit exceeded. Try again later; limit is ${config.writeLimitPerMinute} writes per minute.`)
    }

    const item = await createPocketBaseInterest({ config, fetcher, input: argumentsResult.arguments, token, userId })

    await auditSink({
      action: 'create',
      outcome: 'success',
      summary: { category: item.category, title: item.title },
      targetCollection: interestsCollection,
      targetId: item.id,
      timestamp: new Date(now()).toISOString(),
      toolName: createTool.name,
      userId,
    })

    const output = { item }

    return {
      id,
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      },
    }
  }

  if (params.name === updateTool.name) {
    const argumentsResult = parseUpdateToolArguments(params.arguments)

    if (!argumentsResult.ok) {
      return jsonRpcError(id, -32602, argumentsResult.message)
    }

    if (!writeLimiter.consume(userId, config.writeLimitPerMinute, now())) {
      return jsonRpcError(id, -32029, `Remote MCP write rate limit exceeded. Try again later; limit is ${config.writeLimitPerMinute} writes per minute.`)
    }

    const item = await updatePocketBaseInterest({ config, fetcher, input: argumentsResult.arguments, token, userId })

    if (!item) {
      return jsonRpcError(id, -32004, 'Interest was not found for the authenticated user.')
    }

    await auditSink({
      action: 'update',
      outcome: 'success',
      summary: { changedFields: argumentsResult.changedFields },
      targetCollection: interestsCollection,
      targetId: item.id,
      timestamp: new Date(now()).toISOString(),
      toolName: updateTool.name,
      userId,
    })

    const output = { item }

    return {
      id,
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      },
    }
  }

  if (params.name === updateStatusTool.name) {
    const argumentsResult = parseUpdateStatusToolArguments(params.arguments)

    if (!argumentsResult.ok) {
      return jsonRpcError(id, -32602, argumentsResult.message)
    }

    if (!writeLimiter.consume(userId, config.writeLimitPerMinute, now())) {
      return jsonRpcError(id, -32029, `Remote MCP write rate limit exceeded. Try again later; limit is ${config.writeLimitPerMinute} writes per minute.`)
    }

    const result = await updatePocketBaseInterestStatus({ config, fetcher, input: argumentsResult.arguments, token, userId })

    if (!result) {
      return jsonRpcError(id, -32004, 'Interest was not found for the authenticated user.')
    }

    await auditSink({
      action: 'update_status',
      outcome: 'success',
      summary: { nextStatus: result.item.status, previousStatus: result.previousStatus },
      targetCollection: interestsCollection,
      targetId: result.item.id,
      timestamp: new Date(now()).toISOString(),
      toolName: updateStatusTool.name,
      userId,
    })

    const output = { item: result.item }

    return {
      id,
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      },
    }
  }

  if (params.name !== listTool.name) {
    return jsonRpcError(id, -32601, 'Only makimono_list_interests and currently enabled remote MCP tools are available.')
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

function parseUpdateToolArguments(value: unknown) {
  if (!isRecord(value)) {
    return { ok: false as const, message: 'makimono_update_interest arguments must be an object.' }
  }

  const allowedKeys = new Set(['id', 'notes', 'tags', 'title'])

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false as const, message: `Unsupported makimono_update_interest argument: ${key}.` }
    }
  }

  if (!isString(value.id) || value.id.trim().length === 0) {
    return { ok: false as const, message: 'id must be a non-empty string.' }
  }

  if (value.title !== undefined && (!isString(value.title) || value.title.trim().length === 0)) {
    return { ok: false as const, message: 'title must be a non-empty string when provided.' }
  }

  if (value.notes !== undefined && !isString(value.notes)) {
    return { ok: false as const, message: 'notes must be a string when provided.' }
  }

  if (value.tags !== undefined && !isStringArray(value.tags)) {
    return { ok: false as const, message: 'tags must be an array of strings when provided.' }
  }

  const payload: JsonObject = {}
  const changedFields: string[] = []

  if (value.title !== undefined) {
    payload.title = value.title.trim()
    changedFields.push('title')
  }

  if (value.notes !== undefined) {
    const notes = value.notes.trim()
    payload.notes = notes.length > 0 ? notes : null
    changedFields.push('notes')
  }

  if (value.tags !== undefined) {
    payload.tags = normalizeTags(value.tags)
    changedFields.push('tags')
  }

  if (changedFields.length === 0) {
    return { ok: false as const, message: 'Provide at least one editable field: title, notes, or tags.' }
  }

  return {
    ok: true as const,
    arguments: {
      id: value.id.trim(),
      payload,
    },
    changedFields,
  }
}

function parseUpdateStatusToolArguments(value: unknown) {
  if (!isRecord(value)) {
    return { ok: false as const, message: 'makimono_update_interest_status arguments must be an object.' }
  }

  const allowedKeys = new Set(['id', 'status'])

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false as const, message: `Unsupported makimono_update_interest_status argument: ${key}.` }
    }
  }

  if (!isString(value.id) || value.id.trim().length === 0) {
    return { ok: false as const, message: 'id must be a non-empty string.' }
  }

  if (!isItemStatus(value.status)) {
    return { ok: false as const, message: 'status must be one of: pending, in_progress, completed.' }
  }

  return {
    ok: true as const,
    arguments: {
      id: value.id.trim(),
      status: value.status,
    },
  }
}

function parseCreateToolArguments(value: unknown) {
  if (!isRecord(value)) {
    return { ok: false as const, message: 'makimono_create_interest arguments must be an object.' }
  }

  const allowedKeys = new Set(['category', 'notes', 'tags', 'title'])

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false as const, message: `Unsupported makimono_create_interest argument: ${key}.` }
    }
  }

  if (!isCategory(value.category)) {
    return { ok: false as const, message: 'category must be one of the supported Makimono categories.' }
  }

  if (!isString(value.title) || value.title.trim().length === 0) {
    return { ok: false as const, message: 'title must be a non-empty string.' }
  }

  if (value.notes !== undefined && !isString(value.notes)) {
    return { ok: false as const, message: 'notes must be a string when provided.' }
  }

  if (value.tags !== undefined && !isStringArray(value.tags)) {
    return { ok: false as const, message: 'tags must be an array of strings when provided.' }
  }

  const notes = value.notes?.trim()

  return {
    ok: true as const,
    arguments: {
      category: value.category,
      notes: notes && notes.length > 0 ? notes : null,
      tags: normalizeTags(value.tags),
      title: value.title.trim(),
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

async function createPocketBaseInterest({ config, fetcher, input, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  input: {
    category: Category
    notes: string | null
    tags: string[]
    title: string
  }
  token: string
  userId: string
}) {
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${interestsCollection}/records`, {
    body: JSON.stringify({
      category: input.category,
      notes: input.notes,
      status: 'pending',
      tags: input.tags,
      title: input.title,
      user: userId,
    }),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`PocketBase create request failed with status ${response.status}.`)
  }

  return mapPocketBaseRecord(await response.json() as unknown)
}

async function updatePocketBaseInterest({ config, fetcher, input, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  input: {
    id: string
    payload: JsonObject
  }
  token: string
  userId: string
}) {
  const scopedRecord = await getScopedPocketBaseInterest({ config, fetcher, id: input.id, token, userId })

  if (!scopedRecord) {
    return null
  }

  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${interestsCollection}/records/${encodeURIComponent(input.id)}`, {
    body: JSON.stringify(input.payload),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'PATCH',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`PocketBase update request failed with status ${response.status}.`)
  }

  return mapPocketBaseRecord(await response.json() as unknown)
}

async function updatePocketBaseInterestStatus({ config, fetcher, input, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  input: {
    id: string
    status: ItemStatus
  }
  token: string
  userId: string
}) {
  const scopedRecord = await getScopedPocketBaseInterest({ config, fetcher, id: input.id, token, userId })

  if (!scopedRecord) {
    return null
  }

  const previousItem = mapPocketBaseRecord(scopedRecord)
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${interestsCollection}/records/${encodeURIComponent(input.id)}`, {
    body: JSON.stringify({ status: input.status }),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'PATCH',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`PocketBase status update request failed with status ${response.status}.`)
  }

  return {
    item: mapPocketBaseRecord(await response.json() as unknown),
    previousStatus: previousItem.status,
  }
}

async function getScopedPocketBaseInterest({ config, fetcher, id, token, userId }: {
  config: RemoteMcpConfig
  fetcher: typeof fetch
  id: string
  token: string
  userId: string
}) {
  const searchParams = new URLSearchParams({
    filter: `id=${quotePocketBaseFilterValue(id)} && user=${quotePocketBaseFilterValue(userId)}`,
    perPage: '1',
  })
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${interestsCollection}/records?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`PocketBase scoped interest lookup failed with status ${response.status}.`)
  }

  const result = await response.json() as unknown

  if (!isRecord(result) || !Array.isArray((result as PocketBaseListResponse).items)) {
    throw new Error('PocketBase returned an invalid scoped interest lookup response.')
  }

  return (result as { items: unknown[] }).items.length > 0 ? (result as { items: unknown[] }).items[0] : null
}

function normalizeTags(value: string[] | undefined) {
  if (!value) {
    return []
  }

  return Array.from(new Set(value.map((tag) => tag.trim()).filter(Boolean)))
}

function createInMemoryWriteLimiter(): RemoteMcpWriteLimiter {
  const buckets = new Map<string, { count: number, windowStart: number }>()

  return {
    consume(userId, limit, now) {
      const windowStart = Math.floor(now / 60_000) * 60_000
      const bucket = buckets.get(userId)

      if (!bucket || bucket.windowStart !== windowStart) {
        buckets.set(userId, { count: 1, windowStart })
        return true
      }

      if (bucket.count >= limit) {
        return false
      }

      bucket.count += 1
      return true
    },
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function createPocketBaseAuditSink({ config, fetcher, token }: { config: RemoteMcpConfig, fetcher: typeof fetch, token: string }) {
  return async (event: RemoteMcpAuditEvent) => {
    try {
      await createPocketBaseAuditEvent({ config, event, fetcher, token })
    }
    catch {
      writeSafeAuditEvent(event)
    }
  }
}

async function createPocketBaseAuditEvent({ config, event, fetcher, token }: {
  config: RemoteMcpConfig
  event: RemoteMcpAuditEvent
  fetcher: typeof fetch
  token: string
}) {
  const payload: JsonObject = {
    action: event.action,
    outcome: event.outcome,
    summary: event.summary,
    targetCollection: event.targetCollection,
    targetId: event.targetId,
    timestamp: event.timestamp,
    toolName: event.toolName,
    user: event.userId,
  }

  if (event.clientLabel) {
    payload.clientLabel = event.clientLabel
  }

  if (event.requestId) {
    payload.requestId = event.requestId
  }

  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${encodeURIComponent(config.auditCollection)}/records`, {
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`PocketBase audit create request failed with status ${response.status}.`)
  }
}

function writeSafeAuditEvent(event: RemoteMcpAuditEvent) {
  console.info('[remote-mcp-audit]', JSON.stringify(event))
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
