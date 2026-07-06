import { createFileRoute } from '@tanstack/react-router'

import { DashboardPublicListsIndexRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/public-lists/')({
  component: DashboardPublicListsIndexRoutePage,
})
