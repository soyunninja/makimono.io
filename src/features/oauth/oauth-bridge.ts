import { createHash, randomBytes } from 'node:crypto'

type OAuthBridgeConfig = {
  accessTokenTtlSeconds: number
  allowedClientIds: Set<string>
  allowedRedirectUris: Set<string>
  codeTtlSeconds: number
  issuer: string
  pocketBaseToken: string
  pocketBaseUrl: string
  authCollection: string
}

type AuthorizationCode = {
  challenge: string
  clientId: string
  expiresAt: number
  redirectUri: string
  scope: 'mcp.read'
}

export type OAuthBridgeAccessToken = {
  expiresAt: number
  pocketBaseToken: string
  scope: 'mcp.read'
  userId: string
}

type PocketBaseAuthResponse = {
  record?: unknown
}

type OAuthBridgeDependencies = {
  env?: Record<string, string | undefined>
  fetch?: typeof fetch
  now?: () => number
}

const authorizationCodes = new Map<string, AuthorizationCode>()
const accessTokens = new Map<string, OAuthBridgeAccessToken>()
const defaultCodeTtlSeconds = 300
const defaultAccessTokenTtlSeconds = 900
const defaultAuthCollection = 'users'
const hasOwn = Object.prototype.hasOwnProperty

export function handleOAuthAuthorizationServerMetadata(request: Request, dependencies: OAuthBridgeDependencies = {}) {
  const config = getOAuthBridgeConfig(request, dependencies.env)

  return jsonResponse({
    issuer: config.issuer,
    authorization_endpoint: `${config.issuer}/oauth/authorize`,
    token_endpoint: `${config.issuer}/oauth/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp.read'],
  })
}

export function handleOAuthProtectedResourceMetadata(request: Request, dependencies: OAuthBridgeDependencies = {}) {
  const config = getOAuthBridgeConfig(request, dependencies.env)

  return jsonResponse({
    resource: `${config.issuer}/api/mcp`,
    authorization_servers: [config.issuer],
    scopes_supported: ['mcp.read'],
    bearer_methods_supported: ['header'],
  })
}

export async function handleOAuthAuthorize(request: Request, dependencies: OAuthBridgeDependencies = {}) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  let config: OAuthBridgeConfig

  try {
    config = getOAuthBridgeConfig(request, dependencies.env)
  }
  catch {
    return jsonResponse({ error: 'server_error' }, 500)
  }

  const url = new URL(request.url)
  const validation = validateAuthorizeSearchParams(url.searchParams, config)

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, 400)
  }

  const code = createOpaqueToken('mk_code')
  const now = dependencies.now?.() ?? Date.now()

  authorizationCodes.set(code, {
    challenge: validation.codeChallenge,
    clientId: validation.clientId,
    expiresAt: now + config.codeTtlSeconds * 1000,
    redirectUri: validation.redirectUri,
    scope: 'mcp.read',
  })

  const redirectUrl = new URL(validation.redirectUri)
  redirectUrl.searchParams.set('code', code)

  if (validation.state) {
    redirectUrl.searchParams.set('state', validation.state)
  }

  return new Response(null, {
    headers: { Location: redirectUrl.toString() },
    status: 302,
  })
}

export async function handleOAuthToken(request: Request, dependencies: OAuthBridgeDependencies = {}) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  let config: OAuthBridgeConfig

  let form: URLSearchParams

  const now = dependencies.now?.() ?? Date.now()

  try {
    config = getOAuthBridgeConfig(request, dependencies.env)
    form = await readOAuthForm(request)
  }
  catch {
    return jsonResponse({ error: 'invalid_request' }, 400)
  }

  const grantType = form.get('grant_type')
  const code = form.get('code')?.trim() ?? ''
  const redirectUri = form.get('redirect_uri')?.trim() ?? ''
  const clientId = form.get('client_id')?.trim() ?? ''
  const codeVerifier = form.get('code_verifier')?.trim() ?? ''

  if (grantType !== 'authorization_code' || !code || !redirectUri || !clientId || !codeVerifier) {
    return jsonResponse({ error: 'invalid_request' }, 400)
  }

  const authorizationCode = authorizationCodes.get(code)

  if (!authorizationCode || authorizationCode.expiresAt <= now) {
    authorizationCodes.delete(code)
    return jsonResponse({ error: 'invalid_grant' }, 400)
  }

  if (authorizationCode.clientId !== clientId || authorizationCode.redirectUri !== redirectUri) {
    authorizationCodes.delete(code)
    return jsonResponse({ error: 'invalid_grant' }, 400)
  }

  if (createS256Challenge(codeVerifier) !== authorizationCode.challenge) {
    authorizationCodes.delete(code)
    return jsonResponse({ error: 'invalid_grant' }, 400)
  }

  const fetcher = dependencies.fetch ?? fetch
  const user = await resolvePocketBaseUser({ config, fetcher })

  if (!user.ok) {
    return jsonResponse({ error: 'access_denied' }, 401)
  }

  authorizationCodes.delete(code)

  const accessToken = createOpaqueToken('mk_oauth')
  const expiresAt = now + config.accessTokenTtlSeconds * 1000

  accessTokens.set(accessToken, {
    expiresAt,
    pocketBaseToken: config.pocketBaseToken,
    scope: 'mcp.read',
    userId: user.userId,
  })

  return jsonResponse({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenTtlSeconds,
    scope: 'mcp.read',
  })
}

export function resolveOAuthBridgeAccessToken(token: string, now = Date.now()) {
  const accessToken = accessTokens.get(token)

  if (!accessToken) {
    return null
  }

  if (accessToken.expiresAt <= now) {
    accessTokens.delete(token)
    return null
  }

  return accessToken
}

export function getOAuthBridgeResourceMetadataUrl(request: Request) {
  const origin = new URL(request.url).origin

  return `${origin}/.well-known/oauth-protected-resource`
}

export function resetOAuthBridgeStateForTests() {
  authorizationCodes.clear()
  accessTokens.clear()
}

function getOAuthBridgeConfig(request: Request, env = getProcessEnv()): OAuthBridgeConfig {
  const origin = new URL(request.url).origin
  const issuer = (env.MAKIMONO_OAUTH_ISSUER ?? origin).trim().replace(/\/+$/, '')
  const pocketBaseUrl = (env.MAKIMONO_POCKETBASE_URL ?? env.VITE_POCKETBASE_URL)?.trim().replace(/\/+$/, '')
  const pocketBaseToken = env.MAKIMONO_OAUTH_POCKETBASE_TOKEN?.trim()
  const allowedClientIds = parseAllowlist(env.MAKIMONO_OAUTH_CLIENT_IDS)
  const allowedRedirectUris = parseAllowlist(env.MAKIMONO_OAUTH_REDIRECT_URIS)

  if (!pocketBaseUrl || !pocketBaseToken || allowedClientIds.size === 0 || allowedRedirectUris.size === 0) {
    throw new Error('Missing OAuth bridge configuration.')
  }

  return {
    accessTokenTtlSeconds: parsePositiveInteger(env.MAKIMONO_OAUTH_ACCESS_TOKEN_TTL_SECONDS, defaultAccessTokenTtlSeconds),
    allowedClientIds,
    allowedRedirectUris,
    authCollection: env.MAKIMONO_POCKETBASE_AUTH_COLLECTION?.trim() || defaultAuthCollection,
    codeTtlSeconds: parsePositiveInteger(env.MAKIMONO_OAUTH_CODE_TTL_SECONDS, defaultCodeTtlSeconds),
    issuer,
    pocketBaseToken,
    pocketBaseUrl,
  }
}

function validateAuthorizeSearchParams(params: URLSearchParams, config: OAuthBridgeConfig) {
  const responseType = params.get('response_type')
  const clientId = params.get('client_id')?.trim() ?? ''
  const redirectUri = params.get('redirect_uri')?.trim() ?? ''
  const codeChallenge = params.get('code_challenge')?.trim() ?? ''
  const codeChallengeMethod = params.get('code_challenge_method')
  const scope = params.get('scope')?.trim() || 'mcp.read'
  const state = params.get('state')?.trim() ?? ''

  if (responseType !== 'code') {
    return { ok: false as const, error: 'unsupported_response_type' }
  }

  if (!config.allowedClientIds.has(clientId)) {
    return { ok: false as const, error: 'unauthorized_client' }
  }

  if (!config.allowedRedirectUris.has(redirectUri)) {
    return { ok: false as const, error: 'invalid_request' }
  }

  if (codeChallengeMethod !== 'S256' || !isPkceValue(codeChallenge)) {
    return { ok: false as const, error: 'invalid_request' }
  }

  if (scope !== 'mcp.read') {
    return { ok: false as const, error: 'invalid_scope' }
  }

  return { ok: true as const, clientId, codeChallenge, redirectUri, state }
}

async function readOAuthForm(request: Request) {
  const contentType = request.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/x-www-form-urlencoded')) {
    throw new Error('OAuth token requests must be form encoded.')
  }

  return new URLSearchParams(await request.text())
}

async function resolvePocketBaseUser({ config, fetcher }: { config: OAuthBridgeConfig, fetcher: typeof fetch }) {
  const response = await fetcher(`${config.pocketBaseUrl}/api/collections/${encodeURIComponent(config.authCollection)}/auth-refresh`, {
    headers: { Authorization: `Bearer ${config.pocketBaseToken}` },
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

function createS256Challenge(verifier: string) {
  return base64Url(createHash('sha256').update(verifier).digest())
}

function createOpaqueToken(prefix: string) {
  return `${prefix}_${base64Url(randomBytes(32))}`
}

function base64Url(value: Buffer) {
  return value.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function parseAllowlist(value: string | undefined) {
  return new Set((value ?? '').split(',').map((entry) => entry.trim()).filter(Boolean))
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function isPkceValue(value: string) {
  return /^[A-Za-z0-9._~-]{43,128}$/.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && hasOwn.call(value, 'id')
}

function getProcessEnv() {
  return typeof process === 'undefined' ? {} : process.env
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status })
}
