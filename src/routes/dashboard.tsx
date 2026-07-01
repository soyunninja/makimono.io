import {
  Outlet,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { DashboardRouteShell } from '@/features/items/dashboard-route-shell'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})

export function DashboardRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const repository = useAppInterestRepository()

  if (pathname === '/dashboard/archive' || pathname === '/dashboard/audit' || pathname === '/dashboard/settings') {
    return <Outlet />
  }

  return (
    <PocketBaseAuthGate>
      <DashboardRouteShell pathname={pathname} repository={repository} routedOverlay={<Outlet />} />
    </PocketBaseAuthGate>
  )
}
