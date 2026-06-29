import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { SettingsScreen } from '@/features/settings/settings-screen'

export const Route = createFileRoute('/dashboard/settings')({
  component: DashboardSettingsRoutePage,
})

export function DashboardSettingsRoutePage() {
  return (
    <PocketBaseAuthGate>
      <SettingsScreen />
    </PocketBaseAuthGate>
  )
}
