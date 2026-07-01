import { describe, expect, it, vi } from 'vitest'

import { handleRemoteMcpRequest } from './remote-mcp'

const env = { MAKIMONO_POCKETBASE_URL: 'https://pocketbase.example' }
const writeEnv = { ...env, MAKIMONO_REMOTE_MCP_ENABLE_WRITES: 'true' }

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status })
}

function createRequest(body: unknown, authorization = 'Bearer user-token') {
  return new Request('https://app.example/api/mcp', {
    body: JSON.stringify(body),
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    method: 'POST',
  })
}

function createPocketBaseFetch() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = input.toString()

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return jsonResponse({ record: { id: 'user-1' } })
    }

    if (url.startsWith('https://pocketbase.example/api/collections/interests/records')) {
      return jsonResponse({
        items: [
          {
            id: 'item-1',
            category: 'books',
            created: '2026-01-01T00:00:00.000Z',
            status: 'pending',
            tags: ['architecture'],
            title: 'Clean Architecture',
          },
        ],
      })
    }

    return jsonResponse({ message: 'Unexpected request' }, 500)
  })
}

function createPocketBaseFetchWithCreate() {
  return vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = input.toString()

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return jsonResponse({ record: { id: 'resolved-user' } })
    }

    if (url === 'https://pocketbase.example/api/collections/interests/records' && init?.method === 'POST') {
      const payload = JSON.parse(init.body?.toString() ?? '{}') as Record<string, unknown>

      return jsonResponse({
        id: 'created-1',
        category: payload.category,
        created: '2026-01-03T00:00:00.000Z',
        notes: payload.notes,
        status: 'pending',
        tags: payload.tags,
        title: payload.title,
      })
    }

    return jsonResponse({ message: 'Unexpected request' }, 500)
  })
}

function createPocketBaseFetchWithCreateAndAudit(auditStatus = 200) {
  return vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = input.toString()

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return jsonResponse({ record: { id: 'resolved-user' } })
    }

    if (url === 'https://pocketbase.example/api/collections/interests/records' && init?.method === 'POST') {
      const payload = JSON.parse(init.body?.toString() ?? '{}') as Record<string, unknown>

      return jsonResponse({
        id: 'created-1',
        category: payload.category,
        created: '2026-01-03T00:00:00.000Z',
        notes: payload.notes,
        status: 'pending',
        tags: payload.tags,
        title: payload.title,
      })
    }

    if (url === 'https://pocketbase.example/api/collections/remote_mcp_audit_events/records' && init?.method === 'POST') {
      return jsonResponse({ id: 'audit-1' }, auditStatus)
    }

    return jsonResponse({ message: 'Unexpected request' }, 500)
  })
}

function createPocketBaseFetchWithUpdateAndAudit(options: { scopedItems?: unknown[], auditStatus?: number } = {}) {
  const scopedItems = options.scopedItems ?? [
    {
      id: 'item-1',
      category: 'books',
      created: '2026-01-01T00:00:00.000Z',
      status: 'pending',
      tags: ['architecture'],
      title: 'Clean Architecture',
    },
  ]

  return vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = input.toString()

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return jsonResponse({ record: { id: 'resolved-user' } })
    }

    if (url.startsWith('https://pocketbase.example/api/collections/interests/records?') && init?.method === 'GET') {
      return jsonResponse({ items: scopedItems })
    }

    if (url === 'https://pocketbase.example/api/collections/interests/records/item-1' && init?.method === 'PATCH') {
      const payload = JSON.parse(init.body?.toString() ?? '{}') as Record<string, unknown>

      return jsonResponse({
        id: 'item-1',
        category: 'books',
        created: '2026-01-01T00:00:00.000Z',
        notes: payload.notes,
        status: 'pending',
        tags: payload.tags ?? ['architecture'],
        title: payload.title ?? 'Clean Architecture',
      })
    }

    if (url === 'https://pocketbase.example/api/collections/remote_mcp_audit_events/records' && init?.method === 'POST') {
      return jsonResponse({ id: 'audit-1' }, options.auditStatus ?? 200)
    }

    return jsonResponse({ message: 'Unexpected request' }, 500)
  })
}

function createWriteLimiter(allowed: boolean) {
  return { consume: vi.fn(() => allowed) }
}

function createPocketBaseFetchWithDeletedItem() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = input.toString()

    if (url.endsWith('/api/collections/users/auth-refresh')) {
      return jsonResponse({ record: { id: 'user-1' } })
    }

    if (url.startsWith('https://pocketbase.example/api/collections/interests/records')) {
      return jsonResponse({
        items: [
          {
            id: 'item-1',
            category: 'books',
            created: '2026-01-01T00:00:00.000Z',
            status: 'pending',
            tags: ['architecture'],
            title: 'Clean Architecture',
          },
          {
            id: 'item-2',
            category: 'series',
            created: '2026-01-02T00:00:00.000Z',
            deletedAt: '2026-01-03T00:00:00.000Z',
            status: 'pending',
            tags: ['deleted'],
            title: 'Deleted Series',
          },
        ],
      })
    }

    return jsonResponse({ message: 'Unexpected request' }, 500)
  })
}

describe('handleRemoteMcpRequest', () => {
  it('rejects missing authorization with 401', async () => {
    const response = await handleRemoteMcpRequest(new Request('https://app.example/api/mcp', {
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'tools/list' }),
      method: 'POST',
    }), { env, fetch: createPocketBaseFetch() })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: { code: -32001 } })
  })

  it('omits write tools when remote writes are disabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({ id: 1, jsonrpc: '2.0', method: 'tools/list' }), {
      env,
      fetch: createPocketBaseFetch(),
    })

    await expect(response.json()).resolves.toMatchObject({
      result: {
        tools: [
          {
            name: 'makimono_list_interests',
          },
        ],
      },
    })
  })

  it('rejects create tool calls when remote writes are disabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 2,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { title: 'Dune' }, name: 'makimono_create_interest' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32601 } })
  })

  it('rejects update tool calls when remote writes are disabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 13,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', title: 'Dune Messiah' }, name: 'makimono_update_interest' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32601 } })
  })

  it('includes write tools when remote writes are enabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({ id: 7, jsonrpc: '2.0', method: 'tools/list' }), {
      env: writeEnv,
      fetch: createPocketBaseFetch(),
    })

    await expect(response.json()).resolves.toMatchObject({
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'makimono_create_interest' }),
          expect.objectContaining({ name: 'makimono_update_interest' }),
        ]),
      },
    })
  })

  it('rejects userId in list tool input', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 3,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { userId: 'attacker' }, name: 'makimono_list_interests' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32602 } })
  })

  it('rejects userId and unsupported keys in update tool input', async () => {
    const userIdResponse = await handleRemoteMcpRequest(createRequest({
      id: 14,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', title: 'Dune', userId: 'attacker' }, name: 'makimono_update_interest' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const statusResponse = await handleRemoteMcpRequest(createRequest({
      id: 15,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed' }, name: 'makimono_update_interest' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })

    await expect(userIdResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await expect(statusResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
  })

  it('rejects update no-op payloads', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 16,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_update_interest' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32602 } })
  })

  it('applies authenticated user scope to the PocketBase list request', async () => {
    const fetcher = createPocketBaseFetch()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 4,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { query: 'clean' }, name: 'makimono_list_interests' },
    }), { env, fetch: fetcher })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { count: 1 } } })

    const listUrl = fetcher.mock.calls.map(([input]) => input.toString()).find((url) => url.includes('/api/collections/interests/records'))

    expect(listUrl).toBeDefined()
    expect(new URL(listUrl ?? '').searchParams.get('filter')).toBe('user="user-1"')
  })

  it('hides soft-deleted interests by default and includes them when requested', async () => {
    const defaultResponse = await handleRemoteMcpRequest(createRequest({
      id: 5,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: {}, name: 'makimono_list_interests' },
    }), { env, fetch: createPocketBaseFetchWithDeletedItem() })
    const includeDeletedResponse = await handleRemoteMcpRequest(createRequest({
      id: 6,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { includeDeleted: true }, name: 'makimono_list_interests' },
    }), { env, fetch: createPocketBaseFetchWithDeletedItem() })

    await expect(defaultResponse.json()).resolves.toMatchObject({ result: { structuredContent: { count: 1 } } })
    await expect(includeDeletedResponse.json()).resolves.toMatchObject({ result: { structuredContent: { count: 2 } } })
  })

  it('creates interests with the resolved user id and normalized input', async () => {
    const fetcher = createPocketBaseFetchWithCreate()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 8,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: {
          category: 'books',
          notes: '   ',
          tags: [' sci-fi ', '', 'books', 'sci-fi'],
          title: '  Dune  ',
        },
        name: 'makimono_create_interest',
      },
    }), {
      auditSink: vi.fn(),
      env: writeEnv,
      fetch: fetcher,
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({
      result: { structuredContent: { item: { id: 'created-1', title: 'Dune' } } },
    })

    const createCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records') && init?.method === 'POST')
    const payload = JSON.parse(createCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toMatchObject({
      category: 'books',
      notes: null,
      status: 'pending',
      tags: ['sci-fi', 'books'],
      title: 'Dune',
      user: 'resolved-user',
    })
  })

  it('updates interests with normalized tags and clears notes with an empty string', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 17,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: {
          id: 'item-1',
          notes: '',
          tags: [' sci-fi ', '', 'books', 'sci-fi'],
          title: '  Dune  ',
        },
        name: 'makimono_update_interest',
      },
    }), {
      auditSink: vi.fn(),
      env: writeEnv,
      fetch: fetcher,
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({
      result: { structuredContent: { item: { id: 'item-1', title: 'Dune', tags: ['sci-fi', 'books'] } } },
    })

    const updateCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')
    const payload = JSON.parse(updateCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toEqual({ notes: null, tags: ['sci-fi', 'books'], title: 'Dune' })
    expect(payload).not.toHaveProperty('user')
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('deletedAt')
  })

  it('applies authenticated user scope before update', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 18,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', title: 'Dune' }, name: 'makimono_update_interest' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: fetcher, writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })

    const lookupUrl = fetcher.mock.calls.map(([input]) => input.toString()).find((url) => url.includes('/api/collections/interests/records?'))
    const patchCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')

    expect(lookupUrl).toBeDefined()
    expect(new URL(lookupUrl ?? '').searchParams.get('filter')).toBe('id="item-1" && user="resolved-user"')
    expect(patchCall).toBeDefined()
  })

  it('does not update interests outside the authenticated user scope', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit({ scopedItems: [] })
    const response = await handleRemoteMcpRequest(createRequest({
      id: 19,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', title: 'Dune' }, name: 'makimono_update_interest' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: fetcher, writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32004 } })
    expect(fetcher.mock.calls.some(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')).toBe(false)
  })

  it('rejects create requests when the per-user write rate limit is exceeded', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 9,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { category: 'books', title: 'Dune' },
        name: 'makimono_create_interest',
      },
    }), {
      env: { ...writeEnv, MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE: '1' },
      fetch: createPocketBaseFetchWithCreate(),
      writeLimiter: createWriteLimiter(false),
    })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32029 } })
  })

  it('rejects update requests when the per-user write rate limit is exceeded', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 20,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { id: 'item-1', title: 'Dune' },
        name: 'makimono_update_interest',
      },
    }), {
      env: { ...writeEnv, MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE: '1' },
      fetch: createPocketBaseFetchWithUpdateAndAudit(),
      writeLimiter: createWriteLimiter(false),
    })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32029 } })
  })

  it('emits a safe audit event after successful remote create', async () => {
    const auditSink = vi.fn()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 10,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { category: 'books', title: 'Dune' },
        name: 'makimono_create_interest',
      },
    }), {
      auditSink,
      env: writeEnv,
      fetch: createPocketBaseFetchWithCreate(),
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'created-1' } } } })

    expect(auditSink).toHaveBeenCalledWith({
      action: 'create',
      outcome: 'success',
      summary: { category: 'books', title: 'Dune' },
      targetCollection: 'interests',
      targetId: 'created-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_create_interest',
      userId: 'resolved-user',
    })
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('user-token')
  })

  it('emits a safe audit event after successful remote update', async () => {
    const auditSink = vi.fn()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 21,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { id: 'item-1', notes: '', tags: ['books'] },
        name: 'makimono_update_interest',
      },
    }), {
      auditSink,
      env: writeEnv,
      fetch: createPocketBaseFetchWithUpdateAndAudit(),
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })

    expect(auditSink).toHaveBeenCalledWith({
      action: 'update',
      outcome: 'success',
      summary: { changedFields: ['notes', 'tags'] },
      targetCollection: 'interests',
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_update_interest',
      userId: 'resolved-user',
    })
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('user-token')
  })

  it('creates a durable audit record after successful remote update by default', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 22,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { id: 'item-1', title: 'Dune' },
        name: 'makimono_update_interest',
      },
    }), {
      env: writeEnv,
      fetch: fetcher,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })

    const auditCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/remote_mcp_audit_events/records') && init?.method === 'POST')
    const payload = JSON.parse(auditCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toMatchObject({
      action: 'update',
      outcome: 'success',
      summary: { changedFields: ['title'] },
      targetCollection: 'interests',
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_update_interest',
      user: 'resolved-user',
    })
    expect(JSON.stringify(payload)).not.toContain('user-token')
    expect(JSON.stringify(payload)).not.toContain('Bearer')
  })

  it('creates a durable audit record after successful remote create by default', async () => {
    const fetcher = createPocketBaseFetchWithCreateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 11,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { category: 'books', title: 'Dune' },
        name: 'makimono_create_interest',
      },
    }), {
      env: writeEnv,
      fetch: fetcher,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'created-1' } } } })

    const auditCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/remote_mcp_audit_events/records') && init?.method === 'POST')
    const payload = JSON.parse(auditCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toMatchObject({
      action: 'create',
      outcome: 'success',
      summary: { category: 'books', title: 'Dune' },
      targetCollection: 'interests',
      targetId: 'created-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_create_interest',
      user: 'resolved-user',
    })
    expect(JSON.stringify(payload)).not.toContain('user-token')
    expect(JSON.stringify(payload)).not.toContain('Bearer')
  })

  it('keeps the created item response when durable audit creation fails', async () => {
    const fetcher = createPocketBaseFetchWithCreateAndAudit(500)
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    try {
      const response = await handleRemoteMcpRequest(createRequest({
        id: 12,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          arguments: { category: 'books', title: 'Dune' },
          name: 'makimono_create_interest',
        },
      }), {
        env: writeEnv,
        fetch: fetcher,
        writeLimiter: createWriteLimiter(true),
      })

      await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'created-1' } } } })
      expect(JSON.stringify(consoleInfo.mock.calls)).not.toContain('user-token')
      expect(JSON.stringify(consoleInfo.mock.calls)).not.toContain('Bearer')
    }
    finally {
      consoleInfo.mockRestore()
    }
  })
})
