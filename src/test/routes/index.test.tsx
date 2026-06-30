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

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Makimono',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('v0.4')).toBeInTheDocument()
    expect(screen.getByText(/personalized suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/list subscriptions/i)).toBeInTheDocument()
  })

  it('renders the localized landing copy in Spanish', () => {
    render(
      <LocaleProvider initialLocale="es">
        <FoundationLandingScreen />
      </LocaleProvider>,
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Makimono',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('v0.4')).toBeInTheDocument()
    expect(screen.getByText(/listas compartidas/i)).toBeInTheDocument()
  })
})
