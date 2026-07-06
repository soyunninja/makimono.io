import { createFileRoute } from '@tanstack/react-router'

import { DashboardArchiveRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/archive')({
  component: DashboardArchiveRoutePage,
})
