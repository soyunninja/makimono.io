import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('filters audit events by target id', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => [
        {
          id: 'audit-1',
          action: 'create',
          created: '2026-07-01 10:30:00.000Z',
          outcome: 'success',
          summary: { title: 'Dune' },
          targetId: 'interest-1',
          toolName: 'makimono_create_interest',
        },
        {
          id: 'audit-2',
          action: 'update_status',
          created: '2026-07-01 10:35:00.000Z',
          outcome: 'success',
          summary: { title: 'Akira' },
          targetId: 'interest-2',
          toolName: 'makimono_update_interest_status',
        },
      ]),
    })

    await screen.findByText('interest-1')
    fireEvent.change(screen.getByLabelText('Search MCP audit events'), { target: { value: 'interest-2' } })

    expect(screen.getByText('1 / 2 events shown')).toBeInTheDocument()
    expect(screen.queryByText('interest-1')).not.toBeInTheDocument()
    expect(screen.getByText('interest-2')).toBeInTheDocument()
  })

  it('filters audit events by tool, action, or summary', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => [
        {
          id: 'audit-1',
          action: 'create',
          created: '2026-07-01 10:30:00.000Z',
          outcome: 'success',
          summary: { title: 'Dune' },
          targetId: 'interest-1',
          toolName: 'makimono_create_interest',
        },
        {
          id: 'audit-2',
          action: 'update_status',
          created: '2026-07-01 10:35:00.000Z',
          outcome: 'success',
          summary: { title: 'Akira' },
          targetId: 'interest-2',
          toolName: 'makimono_update_interest_status',
        },
      ]),
    })

    const searchInput = await screen.findByLabelText('Search MCP audit events')

    fireEvent.change(searchInput, { target: { value: 'update_status' } })

    expect(screen.queryByText('makimono_create_interest')).not.toBeInTheDocument()
    expect(screen.getByText('makimono_update_interest_status')).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'Dune' } })

    expect(screen.getByText('makimono_create_interest')).toBeInTheDocument()
    expect(screen.queryByText('makimono_update_interest_status')).not.toBeInTheDocument()
  })

  it('renders a filtered-empty state when loaded audit events do not match the search', async () => {
    renderAuditScreen({
      listEvents: vi.fn(async () => [
        {
          id: 'audit-1',
          action: 'create',
          created: '2026-07-01 10:30:00.000Z',
          outcome: 'success',
          summary: { title: 'Dune' },
          targetId: 'interest-1',
          toolName: 'makimono_create_interest',
        },
      ]),
    })

    fireEvent.change(await screen.findByLabelText('Search MCP audit events'), { target: { value: 'no-match-query' } })

    expect(screen.getByText('No MCP audit events match this search')).toBeInTheDocument()
    expect(screen.getByText('Try a different target, tool, action, outcome, or summary value.')).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
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
