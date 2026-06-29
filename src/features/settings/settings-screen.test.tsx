import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsScreen } from '@/features/settings/settings-screen'
import { LocaleProvider } from '@/i18n/locale-provider'

const authMock = vi.hoisted(() => ({
  isAuthenticated: true,
  logout: vi.fn(async () => {}),
}))

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => authMock,
}))

describe('SettingsScreen', () => {
  it('renders language controls, app version, and authenticated logout', async () => {
    render(
      <LocaleProvider initialLocale={'en'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Manage language, session, and app details.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('v0.3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(authMock.logout).toHaveBeenCalledTimes(1)
    })
  })

  it('uses localized settings copy and language switching', () => {
    render(
      <LocaleProvider initialLocale={'es'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByText('Gestiona el idioma, la sesión y los detalles de la app.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
    expect(screen.getByText('Versión')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
  })
})
