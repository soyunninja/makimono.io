import { describe, expect, it, vi } from 'vitest'

import { handleOAuthAuthorize, handleOAuthToken, resetOAuthBridgeStateForTests } from '@/features/oauth/oauth-bridge'

import { handleRemoteMcpRequest } from './remote-mcp'

const env = { MAKIMONO_POCKETBASE_URL: 'https://pocketbase.example' }
const writeEnv = { ...env, MAKIMONO_REMOTE_MCP_ENABLE_WRITES: 'true' }
const oauthEnv = {
  ...writeEnv,
  MAKIMONO_OAUTH_CLIENT_IDS: 'chatgpt-client',
  MAKIMONO_OAUTH_POCKETBASE_TOKEN: 'server-pocketbase-token',
  MAKIMONO_OAUTH_REDIRECT_URIS: 'https://chat.openai.com/aip/g-123/oauth/callback',
}
const oauthWriteEnv = {
  ...oauthEnv,
  MAKIMONO_OAUTH_ENABLE_WRITES: 'true',
}
const oauthVerifier = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'
const oauthChallenge = 'ImpiCd8pp4MveCNnbIS7-GXEtB0xF5HMIDoWqvGA5ig'

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

async function createOAuthAccessToken(fetcher: typeof fetch, options: { env?: Record<string, string>, scope?: string } = {}) {
  resetOAuthBridgeStateForTests()

  const bridgeEnv = options.env ?? oauthEnv
  const scope = options.scope ?? 'mcp.read'

  const authorizeUrl = new URL('https://app.example/oauth/authorize')
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', 'chatgpt-client')
  authorizeUrl.searchParams.set('redirect_uri', 'https://chat.openai.com/aip/g-123/oauth/callback')
  authorizeUrl.searchParams.set('code_challenge', oauthChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('scope', scope)

  const authorizeResponse = await handleOAuthAuthorize(new Request(authorizeUrl), { env: bridgeEnv })
  const code = new URL(authorizeResponse.headers.get('Location') ?? '').searchParams.get('code') ?? ''
  const tokenResponse = await handleOAuthToken(new Request('https://app.example/oauth/token', {
    body: new URLSearchParams({
      client_id: 'chatgpt-client',
      code,
      code_verifier: oauthVerifier,
      grant_type: 'authorization_code',
      redirect_uri: 'https://chat.openai.com/aip/g-123/oauth/callback',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  }), { env: bridgeEnv, fetch: fetcher })
  const body = await tokenResponse.json() as { access_token: string }

  return body.access_token
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
      const deletedAt = Object.prototype.hasOwnProperty.call(payload, 'deletedAt') ? payload.deletedAt : undefined

      return jsonResponse({
        id: 'item-1',
        category: 'books',
        created: '2026-01-01T00:00:00.000Z',
        deletedAt,
        notes: payload.notes,
        status: payload.status ?? 'pending',
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
    expect(response.headers.get('WWW-Authenticate')).toContain('/.well-known/oauth-protected-resource')
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

  it('rejects status update tool calls when remote writes are disabled', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 23,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed' }, name: 'makimono_update_interest_status' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32601 } })
  })

  it('rejects delete and restore tool calls when remote writes are disabled', async () => {
    const deleteResponse = await handleRemoteMcpRequest(createRequest({
      id: 32,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'soft-delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), { env, fetch: createPocketBaseFetch() })
    const restoreResponse = await handleRemoteMcpRequest(createRequest({
      id: 33,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_restore_interest' },
    }), { env, fetch: createPocketBaseFetch() })

    await expect(deleteResponse.json()).resolves.toMatchObject({ error: { code: -32601 } })
    await expect(restoreResponse.json()).resolves.toMatchObject({ error: { code: -32601 } })
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
          expect.objectContaining({ name: 'makimono_delete_interest' }),
          expect.objectContaining({ name: 'makimono_restore_interest' }),
          expect.objectContaining({ name: 'makimono_update_interest' }),
          expect.objectContaining({ name: 'makimono_update_interest_status' }),
        ]),
      },
    })
  })

  it('keeps OAuth bridge tokens read-only even when remote writes are enabled', async () => {
    const fetcher = createPocketBaseFetch()
    const accessToken = await createOAuthAccessToken(fetcher)
    const listResponse = await handleRemoteMcpRequest(createRequest({ id: 40, jsonrpc: '2.0', method: 'tools/list' }, `Bearer ${accessToken}`), {
      env: oauthEnv,
      fetch: fetcher,
    })
    const writeResponse = await handleRemoteMcpRequest(createRequest({
      id: 41,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { category: 'books', title: 'Dune' }, name: 'makimono_create_interest' },
    }, `Bearer ${accessToken}`), { env: oauthEnv, fetch: fetcher })

    await expect(listResponse.json()).resolves.toMatchObject({
      result: {
        tools: [
          { name: 'makimono_list_interests' },
        ],
      },
    })
    await expect(writeResponse.json()).resolves.toMatchObject({ error: { code: -32601 } })
  })

  it('includes write tools for OAuth write tokens only when OAuth and remote writes are enabled', async () => {
    const fetcher = createPocketBaseFetch()
    const accessToken = await createOAuthAccessToken(fetcher, { env: oauthWriteEnv, scope: 'mcp.read mcp.write' })
    const enabledResponse = await handleRemoteMcpRequest(createRequest({ id: 42, jsonrpc: '2.0', method: 'tools/list' }, `Bearer ${accessToken}`), {
      env: oauthWriteEnv,
      fetch: fetcher,
    })
    const oauthDisabledResponse = await handleRemoteMcpRequest(createRequest({ id: 43, jsonrpc: '2.0', method: 'tools/list' }, `Bearer ${accessToken}`), {
      env: oauthEnv,
      fetch: fetcher,
    })
    const remoteDisabledResponse = await handleRemoteMcpRequest(createRequest({ id: 44, jsonrpc: '2.0', method: 'tools/list' }, `Bearer ${accessToken}`), {
      env: { ...oauthWriteEnv, MAKIMONO_REMOTE_MCP_ENABLE_WRITES: 'false' },
      fetch: fetcher,
    })

    await expect(enabledResponse.json()).resolves.toMatchObject({
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'makimono_create_interest' }),
          expect.objectContaining({ name: 'makimono_update_interest' }),
        ]),
      },
    })
    await expect(oauthDisabledResponse.json()).resolves.toMatchObject({ result: { tools: [{ name: 'makimono_list_interests' }] } })
    await expect(remoteDisabledResponse.json()).resolves.toMatchObject({ result: { tools: [{ name: 'makimono_list_interests' }] } })
  })

  it('allows OAuth write tokens to call guarded write tools when both write flags are enabled', async () => {
    const fetcher = createPocketBaseFetchWithCreateAndAudit()
    const accessToken = await createOAuthAccessToken(fetcher, { env: oauthWriteEnv, scope: 'mcp.read mcp.write' })
    const response = await handleRemoteMcpRequest(createRequest({
      id: 45,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { category: 'books', title: 'Dune' }, name: 'makimono_create_interest' },
    }, `Bearer ${accessToken}`), { env: oauthWriteEnv, fetch: fetcher, writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'created-1' } } } })
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

  it('rejects invalid status update input', async () => {
    const unsupportedKeyResponse = await handleRemoteMcpRequest(createRequest({
      id: 24,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed', userId: 'attacker' }, name: 'makimono_update_interest_status' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const invalidStatusResponse = await handleRemoteMcpRequest(createRequest({
      id: 25,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'deleted' }, name: 'makimono_update_interest_status' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const noIdResponse = await handleRemoteMcpRequest(createRequest({
      id: 26,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: '', status: 'completed' }, name: 'makimono_update_interest_status' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const titleResponse = await handleRemoteMcpRequest(createRequest({
      id: 27,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed', title: 'Dune' }, name: 'makimono_update_interest_status' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })

    await expect(unsupportedKeyResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await expect(invalidStatusResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await expect(noIdResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await expect(titleResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
  })

  it('rejects invalid delete and restore input', async () => {
    const missingConfirmResponse = await handleRemoteMcpRequest(createRequest({
      id: 34,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_delete_interest' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const wrongConfirmResponse = await handleRemoteMcpRequest(createRequest({
      id: 35,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) })
    const unsupportedKeys = ['userId', 'status', 'deletedAt', 'title', 'notes', 'tags']
    const unsupportedResponses = await Promise.all(unsupportedKeys.flatMap((key, index) => [
      handleRemoteMcpRequest(createRequest({
        id: 36 + index,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { arguments: { confirm: 'soft-delete', id: 'item-1', [key]: 'unsupported' }, name: 'makimono_delete_interest' },
      }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) }),
      handleRemoteMcpRequest(createRequest({
        id: 46 + index,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { arguments: { id: 'item-1', [key]: 'unsupported' }, name: 'makimono_restore_interest' },
      }), { env: writeEnv, fetch: createPocketBaseFetchWithUpdateAndAudit(), writeLimiter: createWriteLimiter(true) }),
    ]))

    await expect(missingConfirmResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await expect(wrongConfirmResponse.json()).resolves.toMatchObject({ error: { code: -32602 } })
    await Promise.all(unsupportedResponses.map(async (response) => {
      await expect(response.json()).resolves.toMatchObject({ error: { code: -32602 } })
    }))
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

  it('applies authenticated user scope before status update', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 28,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed' }, name: 'makimono_update_interest_status' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: fetcher, writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1', status: 'completed' } } } })

    const lookupUrl = fetcher.mock.calls.map(([input]) => input.toString()).find((url) => url.includes('/api/collections/interests/records?'))
    const patchCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')
    const payload = JSON.parse(patchCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(lookupUrl).toBeDefined()
    expect(new URL(lookupUrl ?? '').searchParams.get('filter')).toBe('id="item-1" && user="resolved-user"')
    expect(payload).toEqual({ status: 'completed' })
  })

  it('does not status update interests outside the authenticated user scope', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit({ scopedItems: [] })
    const response = await handleRemoteMcpRequest(createRequest({
      id: 29,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1', status: 'completed' }, name: 'makimono_update_interest_status' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: fetcher, writeLimiter: createWriteLimiter(true) })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32004 } })
    expect(fetcher.mock.calls.some(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')).toBe(false)
  })

  it('soft deletes interests with confirmation and audits the event', async () => {
    const auditSink = vi.fn()
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 38,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'soft-delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), {
      auditSink,
      env: writeEnv,
      fetch: fetcher,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { deletedAt: '2026-01-03T12:00:00.000Z', id: 'item-1' } } } })

    const patchCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')
    const payload = JSON.parse(patchCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toEqual({ deletedAt: '2026-01-03T12:00:00.000Z' })
    expect(auditSink).toHaveBeenCalledWith(expect.objectContaining({
      action: 'soft_delete',
      summary: expect.objectContaining({ category: 'books', deletedAt: '2026-01-03T12:00:00.000Z', status: 'pending', title: 'Clean Architecture' }),
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_delete_interest',
      userId: 'resolved-user',
    }))
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('user-token')
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('Bearer')
  })

  it('restores interests by clearing deletedAt and audits the event', async () => {
    const auditSink = vi.fn()
    const fetcher = createPocketBaseFetchWithUpdateAndAudit({
      scopedItems: [{
        id: 'item-1',
        category: 'books',
        created: '2026-01-01T00:00:00.000Z',
        deletedAt: '2026-01-02T00:00:00.000Z',
        status: 'pending',
        tags: ['architecture'],
        title: 'Clean Architecture',
      }],
    })
    const response = await handleRemoteMcpRequest(createRequest({
      id: 39,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_restore_interest' },
    }), {
      auditSink,
      env: writeEnv,
      fetch: fetcher,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })

    const patchCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')
    const payload = JSON.parse(patchCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toEqual({ deletedAt: null })
    expect(auditSink).toHaveBeenCalledWith(expect.objectContaining({
      action: 'restore',
      summary: expect.objectContaining({ category: 'books', previousDeletedAt: '2026-01-02T00:00:00.000Z', restoredAt: '2026-01-03T12:00:00.000Z', status: 'pending', title: 'Clean Architecture' }),
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_restore_interest',
      userId: 'resolved-user',
    }))
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('user-token')
    expect(JSON.stringify(auditSink.mock.calls)).not.toContain('Bearer')
  })

  it('applies authenticated user scope before delete and restore', async () => {
    const deleteFetch = createPocketBaseFetchWithUpdateAndAudit({ scopedItems: [] })
    const restoreFetch = createPocketBaseFetchWithUpdateAndAudit({ scopedItems: [] })
    const deleteResponse = await handleRemoteMcpRequest(createRequest({
      id: 40,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'soft-delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: deleteFetch, writeLimiter: createWriteLimiter(true) })
    const restoreResponse = await handleRemoteMcpRequest(createRequest({
      id: 41,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_restore_interest' },
    }), { auditSink: vi.fn(), env: writeEnv, fetch: restoreFetch, writeLimiter: createWriteLimiter(true) })

    await expect(deleteResponse.json()).resolves.toMatchObject({ error: { code: -32004 } })
    await expect(restoreResponse.json()).resolves.toMatchObject({ error: { code: -32004 } })
    expect(deleteFetch.mock.calls.some(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')).toBe(false)
    expect(restoreFetch.mock.calls.some(([input, init]) => input.toString().endsWith('/api/collections/interests/records/item-1') && init?.method === 'PATCH')).toBe(false)
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

  it('rejects status update requests when the per-user write rate limit is exceeded', async () => {
    const response = await handleRemoteMcpRequest(createRequest({
      id: 30,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { id: 'item-1', status: 'completed' },
        name: 'makimono_update_interest_status',
      },
    }), {
      env: { ...writeEnv, MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE: '1' },
      fetch: createPocketBaseFetchWithUpdateAndAudit(),
      writeLimiter: createWriteLimiter(false),
    })

    await expect(response.json()).resolves.toMatchObject({ error: { code: -32029 } })
  })

  it('rejects delete and restore requests when the per-user write rate limit is exceeded', async () => {
    const deleteResponse = await handleRemoteMcpRequest(createRequest({
      id: 42,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'soft-delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), {
      env: { ...writeEnv, MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE: '1' },
      fetch: createPocketBaseFetchWithUpdateAndAudit(),
      writeLimiter: createWriteLimiter(false),
    })
    const restoreResponse = await handleRemoteMcpRequest(createRequest({
      id: 43,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_restore_interest' },
    }), {
      env: { ...writeEnv, MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE: '1' },
      fetch: createPocketBaseFetchWithUpdateAndAudit(),
      writeLimiter: createWriteLimiter(false),
    })

    await expect(deleteResponse.json()).resolves.toMatchObject({ error: { code: -32029 } })
    await expect(restoreResponse.json()).resolves.toMatchObject({ error: { code: -32029 } })
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

  it('creates a durable audit record after successful remote status update by default', async () => {
    const fetcher = createPocketBaseFetchWithUpdateAndAudit()
    const response = await handleRemoteMcpRequest(createRequest({
      id: 31,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: { id: 'item-1', status: 'completed' },
        name: 'makimono_update_interest_status',
      },
    }), {
      env: writeEnv,
      fetch: fetcher,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1', status: 'completed' } } } })

    const auditCall = fetcher.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/remote_mcp_audit_events/records') && init?.method === 'POST')
    const payload = JSON.parse(auditCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(payload).toMatchObject({
      action: 'update_status',
      outcome: 'success',
      summary: { nextStatus: 'completed', previousStatus: 'pending' },
      targetCollection: 'interests',
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_update_interest_status',
      user: 'resolved-user',
    })
    expect(JSON.stringify(payload)).not.toContain('user-token')
    expect(JSON.stringify(payload)).not.toContain('Bearer')
  })

  it('creates durable audit records after successful remote delete and restore by default', async () => {
    const deleteFetch = createPocketBaseFetchWithUpdateAndAudit()
    const restoreFetch = createPocketBaseFetchWithUpdateAndAudit({
      scopedItems: [{
        id: 'item-1',
        category: 'books',
        created: '2026-01-01T00:00:00.000Z',
        deletedAt: '2026-01-02T00:00:00.000Z',
        status: 'pending',
        tags: ['architecture'],
        title: 'Clean Architecture',
      }],
    })

    const deleteResponse = await handleRemoteMcpRequest(createRequest({
      id: 44,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { confirm: 'soft-delete', id: 'item-1' }, name: 'makimono_delete_interest' },
    }), {
      env: writeEnv,
      fetch: deleteFetch,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })
    const restoreResponse = await handleRemoteMcpRequest(createRequest({
      id: 45,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: { id: 'item-1' }, name: 'makimono_restore_interest' },
    }), {
      env: writeEnv,
      fetch: restoreFetch,
      now: () => Date.parse('2026-01-03T12:00:00.000Z'),
      writeLimiter: createWriteLimiter(true),
    })

    await expect(deleteResponse.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })
    await expect(restoreResponse.json()).resolves.toMatchObject({ result: { structuredContent: { item: { id: 'item-1' } } } })

    const deleteAuditCall = deleteFetch.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/remote_mcp_audit_events/records') && init?.method === 'POST')
    const restoreAuditCall = restoreFetch.mock.calls.find(([input, init]) => input.toString().endsWith('/api/collections/remote_mcp_audit_events/records') && init?.method === 'POST')
    const deletePayload = JSON.parse(deleteAuditCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>
    const restorePayload = JSON.parse(restoreAuditCall?.[1]?.body?.toString() ?? '{}') as Record<string, unknown>

    expect(deletePayload).toMatchObject({
      action: 'soft_delete',
      outcome: 'success',
      summary: { category: 'books', deletedAt: '2026-01-03T12:00:00.000Z', previousDeletedAt: null, status: 'pending', title: 'Clean Architecture' },
      targetCollection: 'interests',
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_delete_interest',
      user: 'resolved-user',
    })
    expect(restorePayload).toMatchObject({
      action: 'restore',
      outcome: 'success',
      summary: { category: 'books', previousDeletedAt: '2026-01-02T00:00:00.000Z', restoredAt: '2026-01-03T12:00:00.000Z', status: 'pending', title: 'Clean Architecture' },
      targetCollection: 'interests',
      targetId: 'item-1',
      timestamp: '2026-01-03T12:00:00.000Z',
      toolName: 'makimono_restore_interest',
      user: 'resolved-user',
    })
    expect(JSON.stringify(deletePayload)).not.toContain('user-token')
    expect(JSON.stringify(deletePayload)).not.toContain('Bearer')
    expect(JSON.stringify(restorePayload)).not.toContain('user-token')
    expect(JSON.stringify(restorePayload)).not.toContain('Bearer')
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
