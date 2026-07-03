import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { MyPublicListsScreen } from '@/features/items/my-public-lists-screen'

export const Route = createFileRoute('/dashboard/public-lists/')({
  component: DashboardPublicListsIndexRoutePage,
})

export function DashboardPublicListsIndexRoutePage() {
  return (
    <PocketBaseAuthGate>
      <MyPublicListsScreen />
    </PocketBaseAuthGate>
  )
}
