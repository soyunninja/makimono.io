import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LocaleProvider, useLocale } from '@/i18n/locale-provider'

const initialNavigatorLanguage = window.navigator.language
const initialNavigatorLanguages = [...window.navigator.languages]

function mockBrowserLanguage(language: string, languages: string[] = language ? [language] : []) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  })

  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages,
  })
}

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

afterEach(() => {
  mockBrowserLanguage(initialNavigatorLanguage, initialNavigatorLanguages)
})

describe('LocaleProvider', () => {
  it('respects an explicit initial locale even when the browser prefers another language', () => {
    mockBrowserLanguage('en-US')

    render(
      <LocaleProvider initialLocale="es">
        <LocaleProbe />
      </LocaleProvider>,
    )

    expect(screen.getByText('es')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Me interesa' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')

    fireEvent.click(screen.getByRole('button', { name: 'toggle locale' }))

    expect(screen.getByText('en')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('defaults to Spanish for Spanish browsers when no initial locale is provided', async () => {
    mockBrowserLanguage('es-MX')

    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('es')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Me interesa' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })

  it('switches to English for non-Spanish browsers when no initial locale is provided', async () => {
    mockBrowserLanguage('en-US')

    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('en')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('falls back to Spanish when the browser language is unavailable', async () => {
    mockBrowserLanguage('', [])

    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('es')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Me interesa' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })
})
