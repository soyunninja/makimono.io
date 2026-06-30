import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppFooter } from '@/components/app/app-footer'
import { LocaleProvider } from '@/i18n/locale-provider'

function renderAppFooter(initialLocale: 'en' | 'es') {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <AppFooter />
    </LocaleProvider>,
  )
}

describe('AppFooter', () => {
  it('renders Spanish footer copy from the dictionary', () => {
    renderAppFooter('es')

    expect(screen.getByText('makimono.io')).toBeInTheDocument()
    expect(screen.getByText('©')).toBeInTheDocument()
    expect(screen.getByText(String(new Date().getFullYear()))).toBeInTheDocument()
    expect(screen.getByText('Todos los derechos reservados')).toBeInTheDocument()
    expect(screen.getByText(/Creado bajo el/)).toBeInTheDocument()
    expect(screen.getByText(/de las playas del Cabo de Gata\./)).toBeInTheDocument()
  })

  it('renders English footer copy from the dictionary', () => {
    renderAppFooter('en')

    expect(screen.getByText('All rights reserved')).toBeInTheDocument()
    expect(screen.getByText(/Made under the/)).toBeInTheDocument()
    expect(screen.getByText(/of the Cabo de Gata beaches\./)).toBeInTheDocument()
  })
})
