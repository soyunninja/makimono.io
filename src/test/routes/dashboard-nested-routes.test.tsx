import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    <LocaleProvider>
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

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1, name: 'Your interests', hidden: true })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Add interest' })).toBeInTheDocument()
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
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))

    await waitFor(() => {
      expect(screen.queryByText('Portal 2')).not.toBeInTheDocument()
    })

    await router.navigate({ to: '/dashboard' })

    expect(await screen.findByRole('heading', { level: 2, name: 'Portal 2' })).toBeInTheDocument()
  })

  it('shows a created item on the dashboard after the add flow closes back to /dashboard', async () => {
    const router = await renderRoute('/dashboard/add')

    fireEvent.click(screen.getByRole('radio', { name: 'Books' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Refactoring' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'martin, legacy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    expect(await screen.findByRole('heading', { level: 2, name: 'Refactoring' })).toBeInTheDocument()
  })

  it('opens the edit route when the dashboard card content link is activated', async () => {
    const router = await renderRoute('/dashboard')

    fireEvent.click(await screen.findByRole('link', { name: 'Edit: Arrival' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard/edit/movie-arrival')
    })

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit interest' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete interest' })).toBeInTheDocument()
  })

  it('updates a dashboard item from the edit flow and closes back to /dashboard', async () => {
    const router = await renderRoute('/dashboard/edit/movie-arrival')

    await screen.findByRole('heading', { level: 1, name: 'Your interests', hidden: true })
    expect(screen.getByRole('heading', { level: 1, name: 'Edit interest' })).toBeInTheDocument()

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

  it('soft-deletes an item from the edit flow and returns to the dashboard without the card', async () => {
    const router = await renderRoute('/dashboard/edit/movie-arrival')

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit interest' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete interest' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: 'Arrival' })).not.toBeInTheDocument()
    })
  })
})
