import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DashboardScreen } from '@/features/items/dashboard-screen'
import { SmartSuggesterFlow } from '@/features/suggester/suggester-flow'

export const Route = createFileRoute('/dashboard/suggest')({
  component: DashboardSuggestRoutePage,
})

export function DashboardSuggestRoutePage() {
  const navigate = useNavigate()

  function handleClose() {
    void navigate({ to: '/dashboard' })
  }

  return (
    <>
      <DashboardScreen />
      <SmartSuggesterFlow onRequestClose={handleClose} />
    </>
  )
}
