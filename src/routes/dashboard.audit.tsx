import { createFileRoute } from '@tanstack/react-router'

import { DashboardAuditRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/audit')({
  component: DashboardAuditRoutePage,
})
