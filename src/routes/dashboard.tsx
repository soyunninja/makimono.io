import {
  Outlet,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'

import { DashboardRouteShell } from '@/features/items/dashboard-route-shell'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})

export function DashboardRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (pathname === '/dashboard/archive') {
    return <Outlet />
  }

  return <DashboardRouteShell pathname={pathname} routedOverlay={<Outlet />} />
}
