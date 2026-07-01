import { describe, expect, it, vi } from 'vitest'

import { handleRemoteMcpRequest } from './remote-mcp'

const env = { MAKIMONO_POCKETBASE_URL: 'https://pocketbase.example' }

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

  it('lists only the read-only remote tool', async () => {
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

  it('rejects write tool calls', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 2,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { title: 'Dune' }, name: 'makimono_create_interest' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32601 } })
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
})
