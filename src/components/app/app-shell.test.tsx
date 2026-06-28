import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppShell } from '@/components/app/app-shell'

describe('AppShell', () => {
  it('renders the branded shell content and children', () => {
    render(
      <AppShell
        eyebrow="Foundation slice"
        title="MeInteresa is ready for the next mock UI work unit"
        description="Mock-first UI shell for the first reviewable slice."
        actions={<button type="button">Review next slice</button>}
      >
        <p>Visible child content</p>
      </AppShell>,
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Foundation slice')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MeInteresa is ready for the next mock UI work unit',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mock-first UI shell for the first reviewable slice.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review next slice' })).toBeInTheDocument()
    expect(screen.getByText('Visible child content')).toBeInTheDocument()
  })
})
