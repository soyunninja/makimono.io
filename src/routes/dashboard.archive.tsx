import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { ArchiveScreen } from '@/features/items/archive-screen'

export const Route = createFileRoute('/dashboard/archive')({
  component: DashboardArchiveRoutePage,
})

export function DashboardArchiveRoutePage() {
  const repository = useAppInterestRepository()

  return (
    <PocketBaseAuthGate>
      <ArchiveScreen repository={repository} />
    </PocketBaseAuthGate>
  )
}
