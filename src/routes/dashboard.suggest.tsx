import { createFileRoute } from '@tanstack/react-router'

import { DashboardSuggestRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/suggest')({
  component: DashboardSuggestRoutePage,
})
