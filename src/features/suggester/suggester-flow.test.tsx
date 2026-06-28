import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SmartSuggesterFlow } from '@/features/suggester/suggester-flow'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('SmartSuggesterFlow', () => {
  it('renders exactly three mock recommendation cards with a reason and CTA after time and mood are chosen', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <SmartSuggesterFlow isDesktop />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Focused evening' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Curious' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get 3 picks' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })

    for (const article of screen.getAllByRole('article')) {
      expect(within(article).getByText('Why it fits')).toBeInTheDocument()
      expect(within(article).getByRole('link', { name: 'Track next' })).toHaveAttribute('href', '/dashboard/add')
    }
  })

  it('keeps suggester controls accessible and only enables generation after both choices', async () => {
    render(
      <LocaleProvider initialLocale="en">
        <SmartSuggesterFlow isDesktop={false} />
      </LocaleProvider>,
    )

    const focusedOption = screen.getByRole('radio', { name: 'Focused evening' })
    const curiousOption = screen.getByRole('radio', { name: 'Curious' })
    const generateButton = screen.getByRole('button', { name: 'Get 3 picks' })

    expect(screen.getByRole('radiogroup', { name: 'Available time' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Desired mood' })).toBeInTheDocument()
    expect(focusedOption).toBeEnabled()
    expect(curiousOption).toBeEnabled()
    expect(generateButton).toBeDisabled()

    fireEvent.click(focusedOption)
    fireEvent.click(curiousOption)

    expect(generateButton).toBeEnabled()

    fireEvent.click(generateButton)

    const [article] = await screen.findAllByRole('article')
    const cta = within(article).getByRole('link', { name: 'Track next' })

    expect(within(article).getByText('Why it fits')).toBeInTheDocument()
    expect(within(article).getByText(/Series|Movies|Games|Books|Music/)).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/dashboard/add')
  })
})
