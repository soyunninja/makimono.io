import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetAppInterestRepository } from '@/features/items/mock-repository'
import { LocaleProvider } from '@/i18n/locale-provider'
import { DashboardAddRoutePage } from '@/routes/dashboard.add'
import { DashboardArchiveRoutePage } from '@/routes/dashboard.archive'
import { DashboardEditRoutePage } from '@/routes/dashboard.edit.$itemId'
import { DashboardSuggestRoutePage } from '@/routes/dashboard.suggest'
import { DashboardRoutePage } from '@/routes/dashboard'
import { installMockLocalStorage } from '@/test/mock-local-storage'

function TestRoot() {
  return (
    <LocaleProvider initialLocale="en">
      <Outlet />
    </LocaleProvider>
  )
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
    dashboardEditRoute,
  ]),
])

async function renderRoute(pathname: '/dashboard' | '/dashboard/add' | '/dashboard/suggest' | '/dashboard/archive' | '/dashboard/edit/movie-arrival') {
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

beforeEach(() => {
  installMockLocalStorage()
  window.localStorage.clear()
  resetAppInterestRepository()
})

afterEach(() => {
  window.localStorage.clear()
  resetAppInterestRepository()
})

describe('dashboard nested routes', () => {
  it('renders the adaptive add flow on top of the dashboard without duplicating the dashboard shell', async () => {
    await renderRoute('/dashboard/add')

    await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true })

    expect(screen.getAllByRole('heading', { level: 1, name: 'Your interests', hidden: true })).toHaveLength(1)
    expect(screen.getByRole('link', { hidden: true, name: 'Add interest' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()
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
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument()
  })

  it('opens and closes the local add flow from the dashboard without changing the route', async () => {
    const router = await renderRoute('/dashboard')

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement

    fireEvent.click(within(header).getByRole('button', { name: 'Add interest' }))

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(screen.getByRole('heading', { level: 1, name: 'Add interest' })).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[0])

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Add interest' })).not.toBeInTheDocument()
    })

    expect(router.state.location.pathname).toBe('/dashboard')
  })

  it('opens and closes the local suggester flow from the dashboard without changing the route', async () => {
    const router = await renderRoute('/dashboard')

    const header = (await screen.findByRole('heading', { level: 1, name: 'Your interests' })).closest('header') as HTMLElement

    fireEvent.click(within(header).getByRole('button', { name: 'Get suggestions' }))

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(screen.getByRole('heading', { level: 1, name: 'Suggestions' })).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Close' })[0])

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 1, name: 'Suggestions' })).not.toBeInTheDocument()
    })

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

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit interest' })).not.toBeInTheDocument()
    })
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
      expect(screen.queryByRole('heading', { level: 1, name: 'Add interest' })).not.toBeInTheDocument()
    })

    expect(router.state.location.pathname).toBe('/dashboard')
    expect(await screen.findByRole('heading', { level: 2, name: 'Refactoring' })).toBeInTheDocument()
  })

  it('updates a dashboard item from the edit flow and closes back to /dashboard', async () => {
    const router = await renderRoute('/dashboard/edit/movie-arrival')

    await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true })
    expect(screen.queryByRole('heading', { name: 'Edit interest' })).not.toBeInTheDocument()
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
    const router = await renderRoute('/dashboard/edit/movie-arrival')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit interest' })).not.toBeInTheDocument()
    })
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
