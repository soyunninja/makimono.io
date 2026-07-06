import { createFileRoute } from '@tanstack/react-router'

import { DashboardPublicListsRouteLayout } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/public-lists')({
  component: DashboardPublicListsRouteLayout,
})
