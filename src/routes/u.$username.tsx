import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/u/$username')({
  component: PublicUserRouteLayout,
})

function PublicUserRouteLayout() {
  return <Outlet />
}
