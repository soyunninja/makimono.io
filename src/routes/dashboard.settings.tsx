import { createFileRoute } from '@tanstack/react-router'

import { DashboardSettingsRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/settings')({
  component: DashboardSettingsRoutePage,
})
