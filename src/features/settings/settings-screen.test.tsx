import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsScreen } from '@/features/settings/settings-screen'
import { LocaleProvider } from '@/i18n/locale-provider'
import { installMockLocalStorage } from '@/test/mock-local-storage'

const authMock = vi.hoisted(() => ({
  isAuthenticated: true,
  logout: vi.fn(async () => {}),
  publicProfile: { avatarUrl: '/api/files/users/user-1/avatar.webp', username: 'mariano' } as null | { avatarUrl: string | null, username: string },
  updatePublicProfile: vi.fn(async () => {}),
}))

const avatarNormalizationMock = vi.hoisted(() => ({
  normalizeAvatarForStorage: vi.fn<(_: File) => Promise<unknown>>(async (file) => ({ file, height: 200, mimeType: 'image/webp', ok: true as const, width: 200 })),
}))

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => authMock,
}))

vi.mock('@/features/auth/avatar-normalization', () => ({
  normalizeAvatarForStorage: avatarNormalizationMock.normalizeAvatarForStorage,
}))

beforeEach(() => {
  authMock.logout.mockClear()
  authMock.publicProfile = { avatarUrl: '/api/files/users/user-1/avatar.webp', username: 'mariano' }
  authMock.updatePublicProfile.mockClear()
  avatarNormalizationMock.normalizeAvatarForStorage.mockReset()
  avatarNormalizationMock.normalizeAvatarForStorage.mockImplementation(async (file: File) => ({ file, height: 200, mimeType: 'image/webp', ok: true as const, width: 200 }))
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

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByText('Manage language, session, and app details.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Public profile avatar' })).toHaveAttribute('src', '/api/files/users/user-1/avatar.webp')
    expect(screen.getByText('mariano')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('mariano')
    expect(screen.getByLabelText('Upload avatar')).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp')
    expect(screen.queryByText('mariano@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('Choose the interface language.')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign out of the current PocketBase session.')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard display')).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Dashboard display' })).not.toBeInTheDocument()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.queryByText('Current app version.')).not.toBeInTheDocument()
    expect(screen.getByText('v0.66')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(authMock.logout).toHaveBeenCalledTimes(1)
    })

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))

    expect(await screen.findByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Audit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('uses localized settings copy and language switching', () => {
    render(
      <LocaleProvider initialLocale={'es'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByText('Gestiona el idioma, la sesión y los detalles de la app.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Volver al dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Volver al dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
    expect(screen.queryByText('Elige el idioma de la interfaz.')).not.toBeInTheDocument()
    expect(screen.queryByText('Cierra la sesión actual de PocketBase.')).not.toBeInTheDocument()
    expect(screen.queryByText('Visualización del dashboard')).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Visualización del dashboard' })).not.toBeInTheDocument()
    expect(screen.getByText('Versión')).toBeInTheDocument()
    expect(screen.queryByText('Versión actual de la app.')).not.toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Más acciones' }))

    expect(screen.getByRole('menuitem', { name: 'Archivo' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.queryByRole('menuitem', { name: 'Volver al dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Auditoría' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Ajustes' })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
  })

  it('shows fallback avatar and keeps the current avatar unchanged on validation failures', async () => {
    authMock.publicProfile = null
    avatarNormalizationMock.normalizeAvatarForStorage.mockResolvedValueOnce({ error: 'unsupported_type', ok: false, preservesCurrentAvatar: true })

    render(
      <LocaleProvider initialLocale={'en'}>
        <SettingsScreen />
      </LocaleProvider>,
    )

    expect(screen.getByRole('img', { name: 'Public profile avatar placeholder' })).toHaveTextContent('C')
    expect(screen.getByText('Choose a username')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save public profile' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 3 characters.')
    expect(authMock.updatePublicProfile).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'valid_user' } })
    fireEvent.change(screen.getByLabelText('Upload avatar'), { target: { files: [new File(['text'], 'avatar.txt', { type: 'text/plain' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Save public profile' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPG, PNG, GIF, or WebP image. The current avatar was not changed.')
    expect(authMock.updatePublicProfile).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Public profile avatar placeholder' })).toBeInTheDocument()
  })
})
