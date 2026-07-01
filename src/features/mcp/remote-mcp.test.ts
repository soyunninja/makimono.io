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

  it('omits the create tool when remote writes are disabled', async () => {
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

  it('includes the create tool when remote writes are enabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({ id: 7, jsonrpc: '2.0', method: 'tools/list' }), {
      env: writeEnv,
      fetch: createPocketBaseFetch(),
    })

    await expect(response.json()).resolves.toMatchObject({
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'makimono_create_interest' }),
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
