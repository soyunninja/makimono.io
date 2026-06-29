import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppShell } from '@/components/app/app-shell'

describe('AppShell', () => {
  it('renders the branded shell content and children', () => {
    render(
      <AppShell
        eyebrow="Foundation slice"
        title="Kyoumi is ready for the next mock UI work unit"
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
        name: 'Kyoumi is ready for the next mock UI work unit',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mock-first UI shell for the first reviewable slice.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review next slice' })).toBeInTheDocument()
    expect(screen.getByText('Visible child content')).toBeInTheDocument()
  })

  it('supports plain header and content surfaces for screen-specific layouts', () => {
    render(
      <AppShell
        actions={<button type="button">Open actions</button>}
        contentVariant="plain"
        headerVariant="plain"
        title="Dashboard"
      >
        <p>Plain child content</p>
      </AppShell>,
    )

    const header = screen.getByRole('heading', { level: 1, name: 'Dashboard' }).closest('header') as HTMLElement
    const section = screen.getByText('Plain child content').closest('section') as HTMLElement

    expect(screen.queryByText('Foundation slice')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open actions' })).toBeInTheDocument()
    expect(header).toHaveAttribute('data-variant', 'plain')
    expect(header).not.toHaveClass('rounded-3xl', 'border', 'bg-card/80', 'shadow-2xl', 'backdrop-blur')
    expect(section).toHaveAttribute('data-variant', 'plain')
    expect(section).toHaveClass('min-w-0')
    expect(section).not.toHaveClass('rounded-3xl', 'border', 'bg-card/65', 'shadow-xl', 'backdrop-blur')
  })
})
