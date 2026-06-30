import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { itemCategories, itemStatuses, type Category, type InterestItem, type ItemStatus } from '../src/features/items/types'

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

type PocketBaseConfig = {
  baseUrl: string
  token: string
  userId?: string
}

type JsonObject = Record<string, unknown>

const interestsCollection = 'interests'
const hasOwn = Object.prototype.hasOwnProperty
const categorySchema = z.enum(itemCategories)
const statusSchema = z.enum(itemStatuses)

const listInterestsInputSchema = {
  includeDeleted: z.boolean().optional(),
  query: z.string().trim().optional(),
}

const createInterestInputSchema = {
  category: categorySchema,
  title: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
}

const updateInterestInputSchema = {
  id: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
}

const updateInterestStatusInputSchema = {
  id: z.string().trim().min(1),
  status: statusSchema,
}

const interestIdInputSchema = {
  id: z.string().trim().min(1),
}

function getPocketBaseConfig(env: NodeJS.ProcessEnv = process.env): PocketBaseConfig {
  const baseUrl = (env.MAKIMONO_POCKETBASE_URL ?? env.VITE_POCKETBASE_URL)?.trim()
  const token = env.MAKIMONO_POCKETBASE_TOKEN?.trim()
  const userId = env.MAKIMONO_POCKETBASE_USER_ID?.trim()

  if (!baseUrl) {
    throw new Error('Missing PocketBase URL. Set MAKIMONO_POCKETBASE_URL or VITE_POCKETBASE_URL for the local MCP server.')
  }

  if (!token) {
    throw new Error('Missing PocketBase auth token. Set MAKIMONO_POCKETBASE_TOKEN for the local MCP server.')
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    token,
    userId: userId && userId.length > 0 ? userId : undefined,
  }
}

function normalizeTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))]
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

export function buildUpdateInterestPayload(input: { title?: string, notes?: string, tags?: string[] }) {
  const payload: JsonObject = {}

  if (hasOwn.call(input, 'title') && input.title !== undefined) {
    const title = input.title.trim()

    if (title.length === 0) {
      throw new Error('Title must not be empty when provided.')
    }

    payload.title = title
  }

  if (hasOwn.call(input, 'notes') && input.notes !== undefined) {
    const notes = input.notes?.trim() ?? ''
    payload.notes = notes.length > 0 ? notes : null
  }

  if (hasOwn.call(input, 'tags') && input.tags !== undefined) {
    payload.tags = normalizeTags(input.tags)
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Provide at least one editable field: title, notes, or tags.')
  }

  return payload
}

async function requestPocketBase(config: PocketBaseConfig, path: string, init: RequestInit = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }

    throw new Error(`PocketBase request failed with status ${response.status}. Check MCP PocketBase configuration and collection rules.`)
  }

  return await response.json() as unknown
}

async function listPocketBaseInterests(config: PocketBaseConfig) {
  const searchParams = new URLSearchParams({ perPage: '200', sort: '-created' })
  const result = await requestPocketBase(config, `/api/collections/${interestsCollection}/records?${searchParams.toString()}`)

  if (!isRecord(result) || !Array.isArray((result as PocketBaseListResponse).items)) {
    throw new Error('PocketBase returned an invalid interests list response.')
  }

  return (result as { items: unknown[] }).items.map(mapPocketBaseRecord)
}

async function createPocketBaseInterest(config: PocketBaseConfig, input: { category: Category, title: string, notes?: string, tags?: string[] }) {
  if (!config.userId) {
    throw new Error('Missing PocketBase user id. Set MAKIMONO_POCKETBASE_USER_ID before creating interests through MCP.')
  }

  const payload: JsonObject = {
    user: config.userId,
    category: input.category,
    title: input.title,
    status: 'pending',
    notes: input.notes ?? null,
    tags: normalizeTags(input.tags),
  }

  const result = await requestPocketBase(config, `/api/collections/${interestsCollection}/records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapPocketBaseRecord(result)
}

async function updatePocketBaseInterest(config: PocketBaseConfig, id: string, payload: JsonObject) {
  const result = await requestPocketBase(config, `/api/collections/${interestsCollection}/records/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return result === null ? null : mapPocketBaseRecord(result)
}

function toolResult(output: JsonObject) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  }
}

function registerTools(server: McpServer) {
  server.registerTool(
    'makimono_list_interests',
    {
      title: 'List Makimono interests',
      description: 'List PocketBase-backed Makimono interests, optionally including deleted items and filtering by title, category, or tag.',
      inputSchema: listInterestsInputSchema,
    },
    async ({ includeDeleted = false, query }) => {
      const items = filterInterests(await listPocketBaseInterests(getPocketBaseConfig()), { includeDeleted, query })

      return toolResult({ count: items.length, items })
    },
  )

  server.registerTool(
    'makimono_create_interest',
    {
      title: 'Create Makimono interest',
      description: 'Create a pending Makimono interest in PocketBase.',
      inputSchema: createInterestInputSchema,
    },
    async (input) => {
      const item = await createPocketBaseInterest(getPocketBaseConfig(), input)

      return toolResult({ item })
    },
  )

  server.registerTool(
    'makimono_update_interest_status',
    {
      title: 'Update Makimono interest status',
      description: 'Update a Makimono interest status in PocketBase.',
      inputSchema: updateInterestStatusInputSchema,
    },
    async ({ id, status }) => {
      const item = await updatePocketBaseInterest(getPocketBaseConfig(), id, { status })

      return toolResult({ item })
    },
  )

  server.registerTool(
    'makimono_update_interest',
    {
      title: 'Update Makimono interest',
      description: 'Edit a Makimono interest title, notes, or tags in PocketBase.',
      inputSchema: updateInterestInputSchema,
    },
    async ({ id, ...input }) => {
      const item = await updatePocketBaseInterest(getPocketBaseConfig(), id, buildUpdateInterestPayload(input))

      return toolResult({ item })
    },
  )

  server.registerTool(
    'makimono_delete_interest',
    {
      title: 'Soft delete Makimono interest',
      description: 'Soft delete a Makimono interest by setting deletedAt in PocketBase.',
      inputSchema: interestIdInputSchema,
    },
    async ({ id }) => {
      const item = await updatePocketBaseInterest(getPocketBaseConfig(), id, { deletedAt: new Date().toISOString() })

      return toolResult({ item })
    },
  )

  server.registerTool(
    'makimono_restore_interest',
    {
      title: 'Restore Makimono interest',
      description: 'Restore a soft-deleted Makimono interest by clearing deletedAt in PocketBase.',
      inputSchema: interestIdInputSchema,
    },
    async ({ id }) => {
      const item = await updatePocketBaseInterest(getPocketBaseConfig(), id, { deletedAt: null })

      return toolResult({ item })
    },
  )
}

export function createMakimonoMcpServer() {
  const server = new McpServer({ name: 'makimono-local', version: '0.1.0' })

  registerTools(server)

  return server
}

export async function runStdioServer() {
  const server = createMakimonoMcpServer()
  const transport = new StdioServerTransport()

  await server.connect(transport)
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  await runStdioServer()
}
