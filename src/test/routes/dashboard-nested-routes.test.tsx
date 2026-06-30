import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PocketBaseAuthProvider } from '@/features/auth/pocketbase-auth-provider'
import { resetAppInterestRepository } from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { DashboardAddRoutePage } from '@/routes/dashboard.add'
import { DashboardArchiveRoutePage } from '@/routes/dashboard.archive'
import { DashboardEditRoutePage } from '@/routes/dashboard.edit.$itemId'
import { DashboardSettingsRoutePage } from '@/routes/dashboard.settings'
import { DashboardSuggestRoutePage } from '@/routes/dashboard.suggest'
import { DashboardRoutePage } from '@/routes/dashboard'
import { installMockLocalStorage } from '@/test/mock-local-storage'

type AuthRecord = { email: string, id: string }
type AuthChangeCallback = (token: string, record: AuthRecord | null) => void

const pocketBaseMock = vi.hoisted(() => ({
  authChangeCallbacks: [] as AuthChangeCallback[],
  client: null as null | {
    authStore: {
      clear: ReturnType<typeof vi.fn>
      isValid: boolean
      model: AuthRecord | null
      onChange: ReturnType<typeof vi.fn>
      record: AuthRecord | null
      token: string
    }
    collection: ReturnType<typeof vi.fn>
  },
  enabled: false,
}))

vi.mock('@/lib/pocketbase', () => ({
  getPocketBaseClient: () => pocketBaseMock.client,
  getPocketBaseErrorMessage: (_error: unknown, fallbackMessage: string) => fallbackMessage,
  isPocketBaseEnabled: () => pocketBaseMock.enabled,
}))

let shouldUsePocketBaseAuthProvider = false

function TestRoot() {
  const content = (
    <LocaleProvider initialLocale="en">
      <Outlet />
    </LocaleProvider>
  )

  if (shouldUsePocketBaseAuthProvider) {
    return <PocketBaseAuthProvider>{content}</PocketBaseAuthProvider>
  }

  return content
}

const rootRoute = createRootRoute({
  component: TestRoot,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardRoutePage,
})

const dashboardAddRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/add',
  component: DashboardAddRoutePage,
})

const dashboardSuggestRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/suggest',
  component: DashboardSuggestRoutePage,
})

const dashboardArchiveRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/archive',
  component: DashboardArchiveRoutePage,
})

const dashboardSettingsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/settings',
  component: DashboardSettingsRoutePage,
})

const dashboardEditRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/edit/$itemId',
  component: DashboardEditRoutePage,
})

const routeTree = rootRoute.addChildren([
  dashboardRoute.addChildren([
    dashboardAddRoute,
    dashboardSuggestRoute,
    dashboardArchiveRoute,
    dashboardSettingsRoute,
    dashboardEditRoute,
  ]),
])

async function renderRoute(
  pathname: '/dashboard' | '/dashboard/add' | '/dashboard/suggest' | '/dashboard/archive' | '/dashboard/settings' | '/dashboard/edit/movie-arrival',
  options: { withPocketBaseAuthProvider?: boolean } = {},
) {
  shouldUsePocketBaseAuthProvider = options.withPocketBaseAuthProvider ?? false
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [pathname],
    }),
  })

  await router.load()

  render(<RouterProvider router={router} />)

  return router
}

function authenticatePocketBaseMock() {
  const client = pocketBaseMock.client

  if (!client) {
    throw new Error('PocketBase mock client must be initialized before authentication.')
  }

  pocketBaseMock.enabled = true
  client.authStore.isValid = true
  client.authStore.model = {
    email: 'reader@example.com',
    id: 'user-reader',
  }
  client.authStore.record = client.authStore.model
  client.authStore.token = 'test-token'
}

beforeEach(() => {
  installMockLocalStorage()
  window.localStorage.clear()
  resetAppInterestRepository()
  pocketBaseMock.authChangeCallbacks = []
  pocketBaseMock.enabled = false
  pocketBaseMock.client = {
    authStore: {
      clear: vi.fn(),
      isValid: false,
      model: null,
      onChange: vi.fn((callback: AuthChangeCallback) => {
        pocketBaseMock.authChangeCallbacks.push(callback)

        return vi.fn()
      }),
      record: null,
      token: '',
    },
    collection: vi.fn(() => ({
      authWithPassword: vi.fn(),
      create: vi.fn(),
      getFullList: vi.fn(async () => []),
    })),
  }
  shouldUsePocketBaseAuthProvider = false
})

afterEach(() => {
  window.localStorage.clear()
  resetAppInterestRepository()
  shouldUsePocketBaseAuthProvider = false
})

describe('dashboard nested routes', () => {
  it('renders the adaptive add flow on top of the dashboard without duplicating the dashboard shell', async () => {
    await renderRoute('/dashboard/add')

    await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true })

    expect(screen.getAllByRole('heading', { level: 1, name: 'Your interests', hidden: true })).toHaveLength(1)
    expect(screen.getByRole('link', { hidden: true, name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Add' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a category for this item.')).not.toBeInTheDocument()
  })

  it('renders the suggester flow on top of the dashboard without duplicating the dashboard shell', async () => {
    await renderRoute('/dashboard/suggest')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1, name: 'Your interests', hidden: true })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Get 3 picks' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Suggestions' })).toBeInTheDocument()
  })

  it('renders the archive route as a full replacement instead of overlaying the dashboard shell', async () => {
    await renderRoute('/dashboard/archive')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Archive' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Your interests' })).not.toBeInTheDocument()
    expect(screen.queryByText('Review completed items, inspect deleted ones, and restore whatever should return to the dashboard.')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('href', '/dashboard')

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))

    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Archive' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
  })

  it('renders the settings route as a full replacement instead of overlaying the dashboard shell', async () => {
    await renderRoute('/dashboard/settings')

    expect(
      await screen.findByRole('link', { name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Your interests' })).not.toBeInTheDocument()
    expect(screen.queryByText('Manage language, session, and app details.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.queryByText('Choose the interface language.')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign out of the current PocketBase session.')).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Dashboard display' })).not.toBeInTheDocument()
    expect(screen.queryByText('Current app version.')).not.toBeInTheDocument()
    expect(screen.getByText('v0.5')).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }))

    expect(await screen.findByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it('requires PocketBase auth before rendering the settings route content', async () => {
    pocketBaseMock.enabled = true

    await renderRoute('/dashboard/settings', { withPocketBaseAuthProvider: true })

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.queryByText('v0.5')).not.toBeInTheDocument()
  })

  it('does not expose a logout action on the authenticated dashboard route', async () => {
    authenticatePocketBaseMock()

    await renderRoute('/dashboard', { withPocketBaseAuthProvider: true })

    expect(await screen.findByRole('heading', { level: 1, name: 'Your interests' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
  })

  it('does not expose a logout action on the authenticated archive route', async () => {
    authenticatePocketBaseMock()

    await renderRoute('/dashboard/archive', { withPocketBaseAuthProvider: true })

    expect(await screen.findByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
  })

  it('opens and closes the local add flow from the dashboard without changing the route', async () => {
    const router = await renderRoute('/dashboard')

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement

    fireEvent.click(within(header).getByRole('button', { name: 'Add interest' }))

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(screen.getByRole('heading', { level: 1, name: 'Add' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a category for this item.')).not.toBeInTheDocument()

    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Add' })).not.toBeInTheDocument()
    })

    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('does not expose the hidden suggester action from the dashboard actions menu', async () => {
    const router = await renderRoute('/dashboard')

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement

    fireEvent.pointerDown(within(header).getByRole('button', { name: 'More actions' }))

    expect(screen.queryByRole('menuitem', { name: 'Get suggestions' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute('href', '/dashboard/archive')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.queryByRole('menuitem', { name: 'Back to dashboard' })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('restores a completed item from the archive back to the dashboard backlog', async () => {
    const repository = resetAppInterestRepository([])
    const created = await repository.createItem({
      category: 'games',
      title: 'Into the Breach',
      tags: ['tactics'],
    })

    await repository.updateStatus(created.id, 'completed')

    const router = await renderRoute('/dashboard/archive')

    expect(await screen.findByText('Into the Breach')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore: Into the Breach' }))

    await waitFor(() => {
      expect(screen.queryByText('Into the Breach')).not.toBeInTheDocument()
    })

    await router.navigate({ to: '/dashboard' })

    expect(await screen.findByRole('heading', { level: 2, name: 'Into the Breach' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start now: Into the Breach' })).toBeInTheDocument()
  })

  it('restores a deleted item from the archive back to the dashboard list', async () => {
    const repository = resetAppInterestRepository([])
    const created = await repository.createItem({
      category: 'games',
      title: 'Portal 2',
      tags: ['co-op'],
    })

    await repository.deleteItem(created.id)

    const router = await renderRoute('/dashboard/archive')

    expect(await screen.findByText('Portal 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore: Portal 2' }))

    await waitFor(() => {
      expect(screen.queryByText('Portal 2')).not.toBeInTheDocument()
    })

    await router.navigate({ to: '/dashboard' })

    expect(await screen.findByRole('heading', { level: 2, name: 'Portal 2' })).toBeInTheDocument()
  })

  it('shows a created item on the dashboard after the add flow closes back to /dashboard', async () => {
    const router = await renderRoute('/dashboard/add')

    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('radio', { name: 'Books' }))
    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'Refactoring' } })
    fireEvent.change(within(dialog).getByLabelText('Tags'), { target: { value: 'martin, legacy' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    expect(await screen.findByRole('heading', { level: 2, name: 'Refactoring' })).toBeInTheDocument()
  })

  it('opens the local edit overlay when the dashboard card content link is activated without changing the route', async () => {
    const router = await renderRoute('/dashboard')

    fireEvent.click(await screen.findByRole('link', { name: 'Edit: Arrival' }))

    expect(router.state.location.pathname).toBe('/dashboard')

    expect(await screen.findByRole('heading', { name: 'Edit interest' })).toBeInTheDocument()
    expect(screen.queryByText('Update the saved details and keep the item on your dashboard.')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete interest' })).toBeInTheDocument()
  })

  it('shows a created item on the dashboard after the local add flow closes without leaving /dashboard', async () => {
    const router = await renderRoute('/dashboard')

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement

    fireEvent.click(within(header).getByRole('button', { name: 'Add interest' }))

    const dialog = screen.getByRole('dialog')

    fireEvent.click(within(dialog).getByRole('radio', { name: 'Books' }))
    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'Refactoring' } })
    fireEvent.change(within(dialog).getByLabelText('Tags'), { target: { value: 'martin, legacy' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Add' })).not.toBeInTheDocument()
    })

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(await screen.findByRole('heading', { level: 2, name: 'Refactoring' })).toBeInTheDocument()
  })

  it('updates a dashboard item from the edit flow and closes back to /dashboard', async () => {
    const router = await renderRoute('/dashboard/edit/movie-arrival')

    await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true })
    expect(screen.getByRole('heading', { name: 'Edit interest' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Arrival (Director Cut)' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'drama, revisit' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Updated for the next rewatch.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    expect(await screen.findByRole('heading', { level: 2, name: 'Arrival (Director Cut)' })).toBeInTheDocument()
    expect(screen.getByText('Updated for the next rewatch.')).toBeInTheDocument()
  })

  it('updates a dashboard item from the local edit flow and keeps the dashboard route stable', async () => {
    const router = await renderRoute('/dashboard')

    fireEvent.click(await screen.findByRole('link', { name: 'Edit: Arrival' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edit interest' })

    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'Arrival (Director Cut)' } })
    fireEvent.change(within(dialog).getByLabelText('Tags'), { target: { value: 'drama, revisit' } })
    fireEvent.change(within(dialog).getByLabelText('Notes'), { target: { value: 'Updated for the next rewatch.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Edit interest' })).not.toBeInTheDocument()
    })

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(await screen.findByRole('heading', { level: 2, name: 'Arrival (Director Cut)' })).toBeInTheDocument()
    expect(screen.getByText('Updated for the next rewatch.')).toBeInTheDocument()
  })

  it('soft-deletes an item from the edit flow and returns to the dashboard without the card', async () => {
    const router = await renderRoute('/dashboard')

    const arrivalCard = (await screen.findByRole('heading', { level: 2, name: 'Arrival' })).closest('[role="article"]') as HTMLElement
    fireEvent.click(within(arrivalCard).getByRole('link', { name: 'Edit: Arrival' }))

    await screen.findByRole('dialog', { name: 'Edit interest' })

    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete interest' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: 'Arrival' })).not.toBeInTheDocument()
    })
  })
})
