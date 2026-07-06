import { createFileRoute } from '@tanstack/react-router'

import { DashboardAddRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/add')({
  component: DashboardAddRoutePage,
})
