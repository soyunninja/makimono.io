import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { LocaleProvider } from '@/i18n/locale-provider'

type MockAuthState = {
  client: unknown
  enabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
}

let mockAuthState: MockAuthState = {
  client: null,
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
    client: {},
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
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to my account' }))

    await waitFor(() => {
      expect(mockAuthState.login).toHaveBeenCalledWith('mariano@example.com', 'super-secret')
    })
  })

  it('switching to create-account mode updates the submit action and active state', () => {
    mockAuthState.enabled = true

    renderGate('es')

    const loginModeButton = screen.getByRole('button', { name: 'Entrar' })
    const registerModeButton = screen.getByRole('button', { name: 'Crear cuenta' })

    expect(loginModeButton).toHaveAttribute('aria-pressed', 'true')
    expect(registerModeButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Entrar con mi cuenta' })).toBeInTheDocument()

    fireEvent.click(registerModeButton)

    expect(loginModeButton).toHaveAttribute('aria-pressed', 'false')
    expect(registerModeButton).toHaveAttribute('aria-pressed', 'true')
    expect(registerModeButton).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('button', { name: 'Crear cuenta nueva' })).toBeInTheDocument()
  })

  it('submits registration data with localized Spanish copy', async () => {
    mockAuthState.enabled = true

    renderGate('es')

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta nueva' }))

    await waitFor(() => {
      expect(mockAuthState.register).toHaveBeenCalledWith('mariano@example.com', 'super-secret')
    })
    expect(mockAuthState.login).not.toHaveBeenCalled()
  })

  it('keeps the form disabled and visible while the auth client is not ready', () => {
    mockAuthState.enabled = true
    mockAuthState.client = null

    renderGate('es')

    expect(screen.getByRole('status')).toHaveTextContent('Preparando la autenticación…')
    expect(screen.getByRole('button', { name: 'Entrar con mi cuenta' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar con mi cuenta' }))

    expect(mockAuthState.login).not.toHaveBeenCalled()
    expect(mockAuthState.register).not.toHaveBeenCalled()
  })

  it('displays failed login errors accessibly', async () => {
    mockAuthState.enabled = true
    mockAuthState.login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))

    renderGate('es')

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'bad-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar con mi cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Todavía no podemos abrir la puerta')
  })

  it('displays failed registration errors accessibly', async () => {
    mockAuthState.enabled = true
    mockAuthState.register = vi.fn().mockRejectedValue(new Error('El correo ya está registrado'))

    renderGate('es')

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'mariano@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta nueva' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Todavía no podemos abrir la puerta')
  })

  it('renders protected content when the user is authenticated', () => {
    mockAuthState.enabled = true
    mockAuthState.isAuthenticated = true

    renderGate()

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
  })
})
