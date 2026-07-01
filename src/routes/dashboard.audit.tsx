import { createFileRoute } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { McpAuditScreen } from '@/features/mcp/mcp-audit-screen'

export const Route = createFileRoute('/dashboard/audit')({
  component: DashboardAuditRoutePage,
})

export function DashboardAuditRoutePage() {
  return (
    <PocketBaseAuthGate>
      <McpAuditScreen />
    </PocketBaseAuthGate>
  )
}
