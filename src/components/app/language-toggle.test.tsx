import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LanguageToggle } from '@/components/app/language-toggle'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('LanguageToggle', () => {
  it('switches the visible UI language when rendered', () => {
    render(
      <LocaleProvider initialLocale="en">
        <LanguageToggle />
      </LocaleProvider>,
    )

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'ES' }))

    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true')
  })
})
