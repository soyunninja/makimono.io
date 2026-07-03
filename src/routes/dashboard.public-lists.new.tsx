import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { PublicListCreateScreen } from '@/features/items/public-list-create-screen'

export const Route = createFileRoute('/dashboard/public-lists/new')({
  component: DashboardPublicListCreateRoutePage,
})

export function DashboardPublicListCreateRoutePage() {
  return (
    <PocketBaseAuthGate>
      <PublicListCreateScreen />
    </PocketBaseAuthGate>
  )
}
