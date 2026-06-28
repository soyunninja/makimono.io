import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LocaleProvider, useLocale } from '@/i18n/locale-provider'

function LocaleProbe() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div>
      <span>{locale}</span>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      <button onClick={() => setLocale(locale === 'en' ? 'es' : 'en')} type="button">
        toggle locale
      </button>
    </div>
  )
}

describe('LocaleProvider', () => {
  it('exposes translated copy and updates the active locale', () => {
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    expect(screen.getByText('en')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')

    fireEvent.click(screen.getByRole('button', { name: 'toggle locale' }))

    expect(screen.getByText('es')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Tus intereses' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })
})
