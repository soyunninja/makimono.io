import { createHash } from 'node:crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  handleOAuthAuthorizationServerMetadata,
  handleOAuthAuthorize,
  handleOAuthProtectedResourceMetadata,
  handleOAuthToken,
  resetOAuthBridgeStateForTests,
} from './oauth-bridge'

const verifier = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'
const challenge = createHash('sha256').update(verifier).digest('base64url')
const env = {
  MAKIMONO_OAUTH_CLIENT_IDS: 'chatgpt-client',
  MAKIMONO_OAUTH_POCKETBASE_TOKEN: 'server-pocketbase-token',
  MAKIMONO_OAUTH_REDIRECT_URIS: 'https://chat.openai.com/aip/g-123/oauth/callback',
  MAKIMONO_POCKETBASE_URL: 'https://pocketbase.example',
}
const chatGptRedirectUri = 'https://chatgpt.com/connector/oauth/M9q1SOaDd_T2'
const envWithoutPkce = {
  ...env,
  MAKIMONO_OAUTH_CLIENT_IDS: 'chatgpt-makimono',
  MAKIMONO_OAUTH_REDIRECT_URIS: chatGptRedirectUri,
  MAKIMONO_OAUTH_REQUIRE_PKCE: 'false',
}
const writeScopeEnv = {
  ...env,
  MAKIMONO_OAUTH_ENABLE_WRITES: 'true',
}

function createAuthorizeRequest(overrides: Record<string, string> = {}) {
  const url = new URL('https://app.example/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', 'chatgpt-client')
  url.searchParams.set('redirect_uri', 'https://chat.openai.com/aip/g-123/oauth/callback')
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('scope', 'mcp.read')
  url.searchParams.set('state', 'opaque-state')

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      url.searchParams.set(key, value)
    }
    else {
      url.searchParams.delete(key)
    }
  }

  return new Request(url)
}

function createTokenRequest(body: Record<string, string>) {
  return new Request('https://app.example/oauth/token', {
    body: new URLSearchParams(body),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })
}

function createPkceTokenRequest(code: string, overrides: Record<string, string> = {}) {
  return createTokenRequest({
    client_id: 'chatgpt-client',
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: 'https://chat.openai.com/aip/g-123/oauth/callback',
    ...overrides,
  })
}

async function createAuthorizationCode(request: Request, options: { env: Record<string, string>, now?: () => number }) {
  const response = await handleOAuthAuthorize(request, options)

  return new URL(response.headers.get('Location') ?? '').searchParams.get('code') ?? ''
}

function createChatGptAuthorizeRequest(overrides: Record<string, string> = {}) {
  const url = new URL('https://www.makimono.io/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', 'chatgpt-makimono')
  url.searchParams.set('redirect_uri', chatGptRedirectUri)
  url.searchParams.set('scope', 'mcp.read')
  url.searchParams.set('resource', 'https://www.makimono.io/api/mcp')
  url.searchParams.set('state', 'oauth_s_6a45194c9018819183df4ba238111b0f')
  url.searchParams.set('ui_locales', 'es-ES')

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      url.searchParams.set(key, value)
    }
    else {
      url.searchParams.delete(key)
    }
  }

  return new Request(url)
}

function createPocketBaseFetch() {
  return vi.fn(async () => Response.json({ record: { id: 'user-1' } }))
}

afterEach(() => {
  resetOAuthBridgeStateForTests()
})

describe('OAuth bridge metadata', () => {
  it('returns authorization server metadata', async () => {
    const response = handleOAuthAuthorizationServerMetadata(new Request('https://app.example/.well-known/oauth-authorization-server'), { env })

    await expect(response.json()).resolves.toMatchObject({
      authorization_endpoint: 'https://app.example/oauth/authorize',
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code'],
      scopes_supported: ['mcp.read'],
      token_endpoint: 'https://app.example/oauth/token',
    })
  })

  it('returns protected resource metadata', async () => {
    const response = handleOAuthProtectedResourceMetadata(new Request('https://app.example/.well-known/oauth-protected-resource'), { env })

    await expect(response.json()).resolves.toMatchObject({
      authorization_servers: ['https://app.example'],
      resource: 'https://app.example/api/mcp',
      scopes_supported: ['mcp.read'],
    })
  })

  it('includes the write scope in metadata only when OAuth writes are enabled', async () => {
    const authorizationResponse = handleOAuthAuthorizationServerMetadata(new Request('https://app.example/.well-known/oauth-authorization-server'), { env: writeScopeEnv })
    const resourceResponse = handleOAuthProtectedResourceMetadata(new Request('https://app.example/.well-known/oauth-protected-resource'), { env: writeScopeEnv })

    await expect(authorizationResponse.json()).resolves.toMatchObject({ scopes_supported: ['mcp.read', 'mcp.write'] })
    await expect(resourceResponse.json()).resolves.toMatchObject({ scopes_supported: ['mcp.read', 'mcp.write'] })
  })
})

describe('OAuth authorize endpoint', () => {
  it('rejects missing PKCE challenge', async () => {
    const response = await handleOAuthAuthorize(createAuthorizeRequest({ code_challenge: '' }), { env })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_request' })
  })

  it('rejects plain PKCE and invalid redirect URIs', async () => {
    const plainResponse = await handleOAuthAuthorize(createAuthorizeRequest({ code_challenge_method: 'plain' }), { env })
    const redirectResponse = await handleOAuthAuthorize(createAuthorizeRequest({ redirect_uri: 'https://evil.example/callback' }), { env })

    expect(plainResponse.status).toBe(400)
    expect(redirectResponse.status).toBe(400)
  })

  it('redirects with an authorization code for an allowlisted public client', async () => {
    const response = await handleOAuthAuthorize(createAuthorizeRequest(), { env, now: () => 1_000 })

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get('Location') ?? '')
    expect(location.origin + location.pathname).toBe('https://chat.openai.com/aip/g-123/oauth/callback')
    expect(location.searchParams.get('code')).toMatch(/^mk_code_/)
    expect(location.searchParams.get('state')).toBe('opaque-state')
  })

  it('allows ChatGPT-style authorization without PKCE when explicitly disabled', async () => {
    const response = await handleOAuthAuthorize(createChatGptAuthorizeRequest(), { env: envWithoutPkce, now: () => 1_000 })

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get('Location') ?? '')
    expect(location.origin + location.pathname).toBe(chatGptRedirectUri)
    expect(location.searchParams.get('code')).toMatch(/^mk_code_/)
    expect(location.searchParams.get('state')).toBe('oauth_s_6a45194c9018819183df4ba238111b0f')
  })

  it('still rejects invalid client, redirect, and scope when PKCE is disabled', async () => {
    const clientResponse = await handleOAuthAuthorize(createChatGptAuthorizeRequest({ client_id: 'unknown-client' }), { env: envWithoutPkce })
    const redirectResponse = await handleOAuthAuthorize(createChatGptAuthorizeRequest({ redirect_uri: 'https://evil.example/callback' }), { env: envWithoutPkce })
    const scopeResponse = await handleOAuthAuthorize(createChatGptAuthorizeRequest({ scope: 'mcp.write' }), { env: envWithoutPkce })

    expect(clientResponse.status).toBe(400)
    expect(redirectResponse.status).toBe(400)
    expect(scopeResponse.status).toBe(400)
    await expect(clientResponse.json()).resolves.toMatchObject({ error: 'unauthorized_client' })
    await expect(redirectResponse.json()).resolves.toMatchObject({ error: 'invalid_request' })
    await expect(scopeResponse.json()).resolves.toMatchObject({ error: 'invalid_scope' })
  })

  it('rejects write scope authorization when OAuth writes are disabled', async () => {
    const response = await handleOAuthAuthorize(createAuthorizeRequest({ scope: 'mcp.read mcp.write' }), { env })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_scope' })
  })

  it('rejects arbitrary OAuth scopes even when OAuth writes are enabled', async () => {
    const response = await handleOAuthAuthorize(createAuthorizeRequest({ scope: 'mcp.read profile' }), { env: writeScopeEnv })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_scope' })
  })
})

describe('OAuth token endpoint', () => {
  it('rejects an invalid authorization code', async () => {
    const response = await handleOAuthToken(createTokenRequest({
      client_id: 'chatgpt-client',
      code: 'missing-code',
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: 'https://chat.openai.com/aip/g-123/oauth/callback',
    }), { env, fetch: createPocketBaseFetch() })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_grant' })
  })

  it('rejects an invalid code verifier and exchanges a valid code once', async () => {
    const code = await createAuthorizationCode(createAuthorizeRequest(), { env, now: () => 1_000 })
    const fetcher = createPocketBaseFetch()

    const invalidVerifierResponse = await handleOAuthToken(createPkceTokenRequest(code, { code_verifier: `${verifier}x` }), { env, fetch: fetcher, now: () => 2_000 })

    expect(invalidVerifierResponse.status).toBe(400)

    const nextCode = await createAuthorizationCode(createAuthorizeRequest(), { env, now: () => 2_000 })

    const validResponse = await handleOAuthToken(createPkceTokenRequest(nextCode), { env, fetch: fetcher, now: () => 2_000 })

    expect(validResponse.status).toBe(200)
    await expect(validResponse.json()).resolves.toMatchObject({
      access_token: expect.stringMatching(/^mk_oauth_/),
      expires_in: 900,
      scope: 'mcp.read',
      token_type: 'Bearer',
    })
  })

  it('rejects a missing code verifier for PKCE authorization codes', async () => {
    const code = await createAuthorizationCode(createAuthorizeRequest(), { env, now: () => 1_000 })

    const response = await handleOAuthToken(createTokenRequest({
      client_id: 'chatgpt-client',
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://chat.openai.com/aip/g-123/oauth/callback',
    }), { env, fetch: createPocketBaseFetch(), now: () => 2_000 })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'invalid_grant' })
  })

  it('exchanges a non-PKCE authorization code without a verifier when PKCE is disabled', async () => {
    const code = await createAuthorizationCode(createChatGptAuthorizeRequest(), { env: envWithoutPkce, now: () => 1_000 })

    const response = await handleOAuthToken(createTokenRequest({
      client_id: 'chatgpt-makimono',
      code,
      grant_type: 'authorization_code',
      redirect_uri: chatGptRedirectUri,
    }), { env: envWithoutPkce, fetch: createPocketBaseFetch(), now: () => 2_000 })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      access_token: expect.stringMatching(/^mk_oauth_/),
      expires_in: 900,
      scope: 'mcp.read',
      token_type: 'Bearer',
    })
  })

  it('exchanges a code with read and write scopes when OAuth writes are enabled', async () => {
    const code = await createAuthorizationCode(createAuthorizeRequest({ scope: 'mcp.read mcp.write' }), { env: writeScopeEnv, now: () => 1_000 })

    const response = await handleOAuthToken(createPkceTokenRequest(code), { env: writeScopeEnv, fetch: createPocketBaseFetch(), now: () => 2_000 })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      access_token: expect.stringMatching(/^mk_oauth_/),
      scope: 'mcp.read mcp.write',
      token_type: 'Bearer',
    })
  })
})
