import {
  Outlet,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'

import { DashboardScreen } from '@/features/items/dashboard-screen'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})

export function DashboardRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (pathname === '/dashboard/archive') {
    return <Outlet />
  }

  return (
    <>
      <DashboardScreen reloadKey={pathname} />
      <Outlet />
    </>
  )
}
