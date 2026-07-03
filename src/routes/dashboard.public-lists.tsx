import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/public-lists')({
  component: DashboardPublicListsRouteLayout,
})

export function DashboardPublicListsRouteLayout() {
  return <Outlet />
}
