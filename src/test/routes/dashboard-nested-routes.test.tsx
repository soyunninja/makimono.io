import { render, screen } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { LocaleProvider } from '@/i18n/locale-provider'
import { DashboardAddRoutePage } from '@/routes/dashboard.add'
import { DashboardArchiveRoutePage } from '@/routes/dashboard.archive'
import { DashboardSuggestRoutePage } from '@/routes/dashboard.suggest'
import { DashboardRoutePage } from '@/routes/dashboard'

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

const routeTree = rootRoute.addChildren([
  dashboardRoute.addChildren([
    dashboardAddRoute,
    dashboardSuggestRoute,
    dashboardArchiveRoute,
  ]),
])

async function renderRoute(pathname: '/dashboard/add' | '/dashboard/suggest' | '/dashboard/archive') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [pathname],
    }),
  })

  await router.load()

  render(<RouterProvider router={router} />)
}

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
      await screen.findByRole('heading', { level: 1, name: 'Completed items' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Your interests' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument()
  })
})
