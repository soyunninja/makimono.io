import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsScreen } from '@/features/settings/settings-screen'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'

const authMock = vi.hoisted(() => ({
  isAuthenticated: true,
  logout: vi.fn(async () => {}),
}))

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => authMock,
}))

beforeEach(() => {
  authMock.logout.mockClear()
  installMockLocalStorage()
  window.localStorage.clear()
})

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
    expect(screen.getByRole('radiogroup', { name: 'Dashboard display' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Cards' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'List' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Covers' })).not.toBeChecked()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('v0.4')).toBeInTheDocument()

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
    expect(screen.getByRole('radiogroup', { name: 'Visualización del dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tarjetas' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Listado' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Carátulas' })).toBeInTheDocument()
    expect(screen.getByText('Versión')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
  })

  it('persists the selected dashboard display preference', () => {
    const settings = render(
      <LocaleProvider initialLocale={'en'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'List' }))

    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()

    settings.unmount()

    render(
      <LocaleProvider initialLocale={'en'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'Covers' }))

    expect(screen.getByRole('radio', { name: 'Covers' })).toBeChecked()
  })

  it('keeps the preference control usable when localStorage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    })

    render(
      <LocaleProvider initialLocale={'en'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Cards' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'List' }))

    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
  })
})
