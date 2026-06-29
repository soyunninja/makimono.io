import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { AdaptiveEditFlow } from '@/features/items/add-flow'

export const Route = createFileRoute('/dashboard/edit/$itemId')({ component: DashboardEditRoutePage })

export function DashboardEditRoutePage() {
  const { itemId } = Route.useParams()
  const navigate = useNavigate()
  const repository = useAppInterestRepository()
  const handleClose = () => {
    void navigate({ to: '/dashboard' })
  }
  return (
    <AdaptiveEditFlow
      itemId={itemId}
      onDeleted={handleClose}
      onRequestClose={handleClose}
      onUpdated={handleClose}
      repository={repository}
    />
  )
}
