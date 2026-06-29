import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { AdaptiveAddFlow } from '@/features/items/add-flow'

export const Route = createFileRoute('/dashboard/add')({
  component: DashboardAddRoutePage,
})

export function DashboardAddRoutePage() {
  const navigate = useNavigate()
  const repository = useAppInterestRepository()

  function handleClose() {
    void navigate({ to: '/dashboard' })
  }

  return (
    <AdaptiveAddFlow onCreated={handleClose} onRequestClose={handleClose} repository={repository} />
  )
}
