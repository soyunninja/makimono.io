import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'

import { DashboardScreen } from '@/features/items/dashboard-screen'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})

export function DashboardRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()

  if (pathname === '/dashboard/archive') {
    return <Outlet />
  }

  function handleEditItem(itemId: string) {
    void navigate({ params: { itemId }, to: '/dashboard/edit/$itemId' })
  }

  return (
    <>
      <DashboardScreen onEditItem={handleEditItem} reloadKey={pathname} />
      <Outlet />
    </>
  )
}
