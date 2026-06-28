import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FoundationLandingScreen } from '@/features/home/foundation-screen'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('FoundationLandingScreen', () => {
  it('renders the localized reviewable root route contract for the first slice in English', () => {
    render(
      <LocaleProvider>
        <FoundationLandingScreen />
      </LocaleProvider>,
    )

    expect(screen.getByText('Foundation slice')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MeInteresa is ready for the next mock UI work unit',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/without introducing persistence, authentication, or AI integrations/i),
    ).toBeInTheDocument()

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getAllByText('Ready')).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 2, name: 'TanStack Start scaffold' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tailwind CSS v4 theme' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'shadcn-ready baseline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Next autonomous slice' })).toBeInTheDocument()
    expect(
      screen.getByText(/shared UI primitives, mock item boundaries, and ES\/EN dictionaries/i),
    ).toBeInTheDocument()
  })

  it('renders the localized landing copy in Spanish', () => {
    render(
      <LocaleProvider initialLocale="es">
        <FoundationLandingScreen />
      </LocaleProvider>,
    )

    expect(screen.getByText('Base inicial')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MeInteresa está listo para la siguiente unidad mock de UI',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Listo')).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 2, name: 'Siguiente slice autónomo' })).toBeInTheDocument()
  })
})
