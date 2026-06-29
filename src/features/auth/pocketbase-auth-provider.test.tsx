import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { PocketBaseAuthProvider, usePocketBaseAuth } from '@/features/auth/pocketbase-auth-provider'
import { LocaleProvider } from '@/i18n/locale-provider'

type MockAuthRecord = {
  email: string
  id: string
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
      token: string
    }
    collection: ReturnType<typeof vi.fn>
  },
  enabled: true,
  loginRecord: { email: 'mariano@example.com', id: 'user-login' } as MockAuthRecord,
  registerRecord: { email: 'new@example.com', id: 'user-register' } as MockAuthRecord,
}))

vi.mock('@/lib/pocketbase', () => ({
  getPocketBaseClient: () => pocketBaseMock.client,
  getPocketBaseErrorMessage: (_error: unknown, fallbackMessage: string) => fallbackMessage,
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
      token: '',
    },
    collection: vi.fn((collectionName: string) => {
      if (collectionName !== 'users') {
        throw new Error(`Unexpected collection: ${collectionName}`)
      }

      return {
        authWithPassword: vi.fn(async (email: string) => {
          const record = email === pocketBaseMock.registerRecord.email ? pocketBaseMock.registerRecord : pocketBaseMock.loginRecord

          publishAuthChange(`token-${record.id}`, record)
        }),
        create: vi.fn(async () => pocketBaseMock.registerRecord),
      }
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

  it('uses the disabled local fallback when PocketBase is not configured', async () => {
    pocketBaseMock.enabled = false
    pocketBaseMock.client = null

    renderAuthenticatedGate()

    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Checking your session…')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })
})
