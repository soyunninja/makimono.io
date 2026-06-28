import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FoundationLandingScreen } from '@/features/home/foundation-screen'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('FoundationLandingScreen', () => {
  it('renders the localized reviewable root route contract for the first slice in English', () => {
    render(
      <LocaleProvider initialLocale="en">
        <FoundationLandingScreen />
      </LocaleProvider>,
    )

    expect(screen.getByText('Foundation slice')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MeInteresa foundation',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('TanStack Start, Tailwind v4, and shadcn-ready tokens are in place.')).toBeInTheDocument()

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'TanStack Start scaffold' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tailwind CSS v4 theme' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'shadcn-ready baseline' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Next' })).toBeInTheDocument()
    expect(screen.getByText('Add shared UI, mock items, and ES/EN copy on top of this scaffold.')).toBeInTheDocument()
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
        name: 'Base de MeInteresa',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Listo')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Siguiente paso' })).toBeInTheDocument()
  })
})
