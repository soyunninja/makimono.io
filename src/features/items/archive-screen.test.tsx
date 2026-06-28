import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArchiveScreen } from '@/features/items/archive-screen'
import { createMockInterestRepository } from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'

describe('ArchiveScreen', () => {
  it('keeps category colors visible in summary cards and completed item badges', async () => {
    render(
      <LocaleProvider>
        <ArchiveScreen repository={createMockInterestRepository()} />
      </LocaleProvider>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Completed items' })).toBeInTheDocument()

    const [gamesSummary, categoryBadge] = screen.getAllByText('Games')
    const completedArticle = await screen.findByRole('article')

    expect(gamesSummary).toHaveClass('text-accent-green')
    expect(gamesSummary.closest('[data-slot="card"]')).toHaveClass('bg-accent-green/10')
    expect(completedArticle).toHaveClass('border-accent-green/30', 'bg-accent-green/10')
    expect(categoryBadge).toHaveClass('bg-accent-green/10', 'text-accent-green')
  })
})
