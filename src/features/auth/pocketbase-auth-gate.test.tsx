import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { LocaleProvider } from '@/i18n/locale-provider'

type MockAuthState = {
  enabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
}

let mockAuthState: MockAuthState = {
  enabled: false,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => mockAuthState,
}))

function renderGate(locale: 'en' | 'es' = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <PocketBaseAuthGate>
        <div>Protected dashboard</div>
      </PocketBaseAuthGate>
    </LocaleProvider>,
  )
}

beforeEach(() => {
  mockAuthState = {
    enabled: false,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  }
})

describe('PocketBaseAuthGate', () => {
  it('renders children when PocketBase auth is disabled', () => {
    renderGate()

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('renders a loading state while the persisted session is resolving', () => {
    mockAuthState.enabled = true
    mockAuthState.isLoading = true

    renderGate()

    expect(screen.getAllByText('Checking your session…')).not.toHaveLength(0)
    expect(screen.getByText('PocketBase is restoring the saved session.')).toBeInTheDocument()
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
  })

  it('submits login credentials from the auth form', async () => {
    mockAuthState.enabled = true

    renderGate()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[1])

    await waitFor(() => {
      expect(mockAuthState.login).toHaveBeenCalledWith('mariano@example.com', 'super-secret')
    })
  })

  it('submits registration data with localized Spanish copy', async () => {
    mockAuthState.enabled = true

    renderGate('es')

    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' })[0])
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' })[1])

    await waitFor(() => {
      expect(mockAuthState.register).toHaveBeenCalledWith('mariano@example.com', 'super-secret')
    })
  })

  it('renders protected content when the user is authenticated', () => {
    mockAuthState.enabled = true
    mockAuthState.isAuthenticated = true

    renderGate()

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })
})
