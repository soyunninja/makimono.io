import { createFileRoute } from '@tanstack/react-router'

import { DashboardPublicListEditorRoutePage } from '@/routes/-route-components'

export const Route = createFileRoute('/dashboard/public-lists/$listId')({
  component: DashboardPublicListEditorRoutePage,
})
