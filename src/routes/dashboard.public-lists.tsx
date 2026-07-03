import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { MyPublicListsScreen } from '@/features/items/my-public-lists-screen'

export const Route = createFileRoute('/dashboard/public-lists')({
  component: DashboardPublicListsRoutePage,
})

export function DashboardPublicListsRoutePage() {
  return (
    <PocketBaseAuthGate>
      <MyPublicListsScreen />
    </PocketBaseAuthGate>
  )
}
