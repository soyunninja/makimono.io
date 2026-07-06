import { createFileRoute } from '@tanstack/react-router'

import { DashboardPublicListCreateRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/public-lists/new')({
  component: DashboardPublicListCreateRoutePage,
})
