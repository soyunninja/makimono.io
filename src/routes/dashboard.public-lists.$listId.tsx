import { createFileRoute, useParams } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { PublicListEditorScreen } from '@/features/items/public-list-editor-screen'

export const Route = createFileRoute('/dashboard/public-lists/$listId')({
  component: DashboardPublicListEditorRoutePage,
})

export function DashboardPublicListEditorRoutePage() {
  const params = useParams({ strict: false }) as { listId?: string }

  return (
    <PocketBaseAuthGate>
      <PublicListEditorScreen listId={params.listId ?? ''} />
    </PocketBaseAuthGate>
  )
}
