import { createFileRoute } from '@tanstack/react-router'

import { ArchiveScreen } from '@/features/items/archive-screen'

export const Route = createFileRoute('/dashboard/archive')({
  component: DashboardArchiveRoutePage,
})

export function DashboardArchiveRoutePage() {
  return <ArchiveScreen />
}
