import { createFileRoute } from '@tanstack/react-router'

import { DashboardRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})
