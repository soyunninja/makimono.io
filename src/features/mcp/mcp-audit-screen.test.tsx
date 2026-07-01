import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { McpAuditScreen, type McpAuditRepository } from '@/features/mcp/mcp-audit-screen'
import { LocaleProvider } from '@/i18n/locale-provider'

const authMock = vi.hoisted(() => ({
  client: null,
}))

vi.mock('@/features/auth/pocketbase-auth-provider', () => ({
  useOptionalPocketBaseAuth: () => authMock,
}))

function renderAuditScreen(repository: McpAuditRepository) {
  render(
    <LocaleProvider initialLocale={'en'}>
      <McpAuditScreen repository={repository} />
    </LocaleProvider>,
  )
}

describe('McpAuditScreen', () => {
  it('renders the loading state while audit events are being fetched', () => {
    renderAuditScreen({
      listEvents: vi.fn(() => new Promise<never>(() => {})),
    })

    expect(screen.getByText('Loading MCP audit events…')).toBeInTheDocument()
  })

  it('renders the empty state when no audit events exist', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => []),
    })

    expect(await screen.findByText('No MCP audit events yet')).toBeInTheDocument()
    expect(screen.getByText('Remote MCP write events will appear here after they are recorded in PocketBase.')).toBeInTheDocument()
  })

  it('renders audit events with safe summary text', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => [
        {
          id: 'audit-1',
          action: 'create',
          created: '2026-07-01 10:30:00.000Z',
          outcome: 'success',
          summary: { category: 'books', title: 'Dune' },
          targetId: 'interest-1',
          toolName: 'makimono_create_interest',
        },
      ]),
    })

    const article = await screen.findByRole('article')

    expect(within(article).getByText('makimono_create_interest')).toBeInTheDocument()
    expect(within(article).getByText('2026-07-01 10:30:00.000Z')).toBeInTheDocument()
    expect(within(article).getByText('create')).toBeInTheDocument()
    expect(within(article).getByText('success')).toBeInTheDocument()
    expect(within(article).getByText('interest-1')).toBeInTheDocument()
    expect(within(article).getByText(/"title": "Dune"/)).toBeInTheDocument()
  })

  it('renders an error state when audit events cannot be fetched', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => {
        throw new Error('PocketBase unavailable')
      }),
    })

    const alert = await screen.findByRole('alert')

    expect(within(alert).getByText('Could not load MCP audit events')).toBeInTheDocument()
    expect(within(alert).getByText('Check your PocketBase session and audit collection rules, then try again.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })
  })
})
