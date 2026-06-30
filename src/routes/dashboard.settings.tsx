import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { SettingsScreen } from '@/features/settings/settings-screen'

export const Route = createFileRoute('/dashboard/settings')({
  component: DashboardSettingsRoutePage,
})

export function DashboardSettingsRoutePage() {
  const navigate = useNavigate()

  return (
    <PocketBaseAuthGate>
      <SettingsScreen onLoggedOut={() => void navigate({ to: '/' })} />
    </PocketBaseAuthGate>
  )
}
