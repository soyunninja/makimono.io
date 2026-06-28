import { createFileRoute } from '@tanstack/react-router'

import { DashboardScreen } from '@/features/items/dashboard-screen'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoutePage,
})

export function DashboardRoutePage() {
  return <DashboardScreen />
}
