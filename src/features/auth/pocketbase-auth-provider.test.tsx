import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { PocketBaseAuthProvider, usePocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { LocaleProvider } from '@/i18n/locale-provider'

type MockAuthRecord = {
  avatar?: string
  email: string
  id: string
  username?: string
}

type AuthChangeCallback = (token: string, record: MockAuthRecord | null) => void

const pocketBaseMock = vi.hoisted(() => ({
  authChangeCallbacks: [] as AuthChangeCallback[],
  client: null as null | {
    authStore: {
      clear: ReturnType<typeof vi.fn>
      isValid: boolean
      model: unknown
      onChange: ReturnType<typeof vi.fn>
      record: unknown
      save: ReturnType<typeof vi.fn>
      token: string
    }
    collection: ReturnType<typeof vi.fn>
  },
  enabled: true,
  loginRecord: { email: 'mariano@example.com', id: 'user-login' } as MockAuthRecord,
  registerRecord: { email: 'new@example.com', id: 'user-register' } as MockAuthRecord,
  usersCollection: null as null | {
    authWithPassword: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  },
}))

vi.mock('@/lib/pocketbase', () => ({
  getPocketBaseFileUrl: (_collectionName: string, recordId: string, fileName: string) => `/api/files/users/${recordId}/${fileName}`,
  getPocketBaseClient: () => pocketBaseMock.client,
  getPocketBaseErrorMessage: (_error: unknown, fallbackMessage: string) => fallbackMessage,
  isPocketBaseAuthRecord: (value: unknown) => typeof value === 'object' && value !== null && 'id' in value,
  isPocketBaseEnabled: () => pocketBaseMock.enabled,
}))

function renderAuthenticatedGate() {
  return render(
    <LocaleProvider initialLocale={'en'}>
      <PocketBaseAuthProvider>
        <PocketBaseAuthGate>
          <div>Protected dashboard</div>
        </PocketBaseAuthGate>
      </PocketBaseAuthProvider>
    </LocaleProvider>,
  )
}

function renderProviderProbe() {
  return render(
    <LocaleProvider initialLocale={'en'}>
      <PocketBaseAuthProvider>
        <AuthProbe />
      </PocketBaseAuthProvider>
    </LocaleProvider>,
  )
}

function AuthProbe() {
  const auth = usePocketBaseAuth()

  return (
    <div>
      <div>enabled: {String(auth.enabled)}</div>
      <div>loading: {String(auth.isLoading)}</div>
      <div>authenticated: {String(auth.isAuthenticated)}</div>
      <div>public profile: {auth.publicProfile ? `${auth.publicProfile.username}|${auth.publicProfile.avatarUrl ?? 'none'}` : 'none'}</div>
      <div>user: {auth.user?.email ?? 'none'}</div>
      <button onClick={() => void auth.login('mariano@example.com', 'super-secret')} type={'button'}>
        Login
      </button>
      <button onClick={() => void auth.register('new@example.com', 'super-secret')} type={'button'}>
        Register
      </button>
      <button onClick={() => void auth.logout()} type={'button'}>
        Logout
      </button>
      <button onClick={() => void auth.updatePublicProfile({ avatarFile: new File(['avatar'], 'avatar.webp', { type: 'image/webp' }), username: ' Updated_User ' })} type={'button'}>
        Update profile
      </button>
    </div>
  )
}

function publishAuthChange(token: string, record: MockAuthRecord | null) {
  if (!pocketBaseMock.client) {
    return
  }

  pocketBaseMock.client.authStore.token = token
  pocketBaseMock.client.authStore.isValid = token.length > 0 && record !== null
  pocketBaseMock.client.authStore.model = record
  pocketBaseMock.client.authStore.record = record
  pocketBaseMock.authChangeCallbacks.forEach((callback) => callback(token, record))
}

beforeEach(() => {
  pocketBaseMock.authChangeCallbacks = []
  pocketBaseMock.enabled = true
  pocketBaseMock.loginRecord = { email: 'mariano@example.com', id: 'user-login' }
  pocketBaseMock.registerRecord = { email: 'new@example.com', id: 'user-register' }
  pocketBaseMock.usersCollection = {
    authWithPassword: vi.fn(async (email: string) => {
      const record = email === pocketBaseMock.registerRecord.email ? pocketBaseMock.registerRecord : pocketBaseMock.loginRecord

      publishAuthChange(`token-${record.id}`, record)
    }),
    create: vi.fn(async () => pocketBaseMock.registerRecord),
    update: vi.fn(async (id: string, data: FormData) => ({
        avatar: data.get('avatar') instanceof File ? 'avatar.webp' : undefined,
        bio: 'Private biography must not enter publicProfile.',
        collectionId: '_pb_users_auth_',
        collectionName: 'users',
        displayName: 'Private display name',
        email: 'profile@example.com',
        id,
        username: String(data.get('username') ?? ''),
      } satisfies MockAuthRecord & Record<string, unknown>)),
  }
  pocketBaseMock.client = {
    authStore: {
      clear: vi.fn(() => {
        publishAuthChange('', null)
      }),
      isValid: false,
      model: null,
      onChange: vi.fn((callback: AuthChangeCallback) => {
        pocketBaseMock.authChangeCallbacks.push(callback)

        return vi.fn()
      }),
      record: null,
      save: vi.fn((token: string, record: MockAuthRecord | null) => publishAuthChange(token, record)),
      token: '',
    },
    collection: vi.fn((collectionName: string) => {
      if (collectionName !== 'users') {
        throw new Error(`Unexpected collection: ${collectionName}`)
      }

      return pocketBaseMock.usersCollection
    }),
  }
})

describe('PocketBaseAuthProvider', () => {
  it('finishes loading from an empty auth store when the immediate auth change callback does not run', async () => {
    renderAuthenticatedGate()

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Sign in' })).not.toHaveLength(0)
    })

    expect(screen.queryByText('Checking your session…')).not.toBeInTheDocument()
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
  })

  it('does not server-render an indefinite loading gate before a browser PocketBase client exists', () => {
    pocketBaseMock.client = null

    const html = renderToString(
      <LocaleProvider initialLocale={'en'}>
        <PocketBaseAuthProvider>
          <PocketBaseAuthGate>
            <div>Protected dashboard</div>
          </PocketBaseAuthGate>
        </PocketBaseAuthProvider>
      </LocaleProvider>,
    )

    expect(html).toContain('Sign in')
    expect(html).not.toContain('Checking your session')
    expect(html).not.toContain('Protected dashboard')
  })

  it('renders protected content from a persisted authenticated auth store', async () => {
    const record = { email: 'persisted@example.com', id: 'user-persisted' }

    pocketBaseMock.client!.authStore.token = 'persisted-token'
    pocketBaseMock.client!.authStore.isValid = true
    pocketBaseMock.client!.authStore.model = record
    pocketBaseMock.client!.authStore.record = record

    renderAuthenticatedGate()

    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Checking your session…')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('updates provider state after login and logout auth changes', async () => {
    renderProviderProbe()

    expect(await screen.findByText('loading: false')).toBeInTheDocument()
    expect(screen.getByText('authenticated: false')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByText('authenticated: true')).toBeInTheDocument()
    })
    expect(screen.getByText('user: mariano@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByText('authenticated: false')).toBeInTheDocument()
    })
    expect(screen.getByText('user: none')).toBeInTheDocument()
    expect(pocketBaseMock.client!.authStore.clear).toHaveBeenCalledTimes(1)
  })

  it('updates provider state after successful registration and login', async () => {
    renderProviderProbe()

    expect(await screen.findByText('loading: false')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(screen.getByText('authenticated: true')).toBeInTheDocument()
    })
    expect(screen.getByText('user: new@example.com')).toBeInTheDocument()
  })

  it('derives a safe public profile and refreshes it after FormData profile updates', async () => {
    const record = { avatar: 'old-avatar.webp', email: 'profile@example.com', id: 'user-profile', username: 'Mariano' }

    pocketBaseMock.client!.authStore.token = 'profile-token'
    pocketBaseMock.client!.authStore.isValid = true
    pocketBaseMock.client!.authStore.model = record
    pocketBaseMock.client!.authStore.record = record

    renderProviderProbe()

    expect(await screen.findByText('public profile: mariano|/api/files/users/user-profile/old-avatar.webp')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Update profile' }))

    await waitFor(() => {
      expect(screen.getByText('public profile: updated_user|/api/files/users/user-profile/avatar.webp')).toBeInTheDocument()
    })

    expect(pocketBaseMock.usersCollection?.update).toHaveBeenCalledTimes(1)
    const [recordId, payload] = pocketBaseMock.usersCollection?.update.mock.calls[0] as [string, FormData]
    expect(recordId).toBe('user-profile')
    expect(payload).toBeInstanceOf(FormData)
    expect(payload.get('username')).toBe('updated_user')
    expect(payload.get('avatar')).toBeInstanceOf(File)
    expect(screen.queryByText('Private display name')).not.toBeInTheDocument()
    expect(screen.queryByText('Private biography must not enter publicProfile.')).not.toBeInTheDocument()
  })

  it('uses the disabled local fallback when PocketBase is not configured', async () => {
    pocketBaseMock.enabled = false
    pocketBaseMock.client = null

    renderAuthenticatedGate()

    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Checking your session…')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })
})
