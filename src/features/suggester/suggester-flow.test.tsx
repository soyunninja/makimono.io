import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SmartSuggesterFlow } from '@/features/suggester/suggester-flow'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('SmartSuggesterFlow', () => {
  it('renders exactly three mock recommendation cards with a reason and CTA after time and mood are chosen', async () => {
    render(
      <LocaleProvider>
        <SmartSuggesterFlow isDesktop />
      </LocaleProvider>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Focused evening' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Curious' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get 3 suggestions' }))

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })

    for (const article of screen.getAllByRole('article')) {
      expect(within(article).getByText('Why it fits')).toBeInTheDocument()
      expect(within(article).getByRole('link', { name: 'Track this next' })).toHaveAttribute('href', '/dashboard/add')
    }
  })
})
