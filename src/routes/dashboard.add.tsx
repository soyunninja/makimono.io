import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AdaptiveAddFlow } from '@/features/items/add-flow'
import { DashboardScreen } from '@/features/items/dashboard-screen'

export const Route = createFileRoute('/dashboard/add')({
  component: DashboardAddRoutePage,
})

export function DashboardAddRoutePage() {
  const navigate = useNavigate()

  function handleClose() {
    void navigate({ to: '/dashboard' })
  }

  return (
    <>
      <DashboardScreen />
      <AdaptiveAddFlow onCreated={handleClose} onRequestClose={handleClose} />
    </>
  )
}
