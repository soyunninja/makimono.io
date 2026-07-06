import { Outlet, useNavigate, useParams, useRouterState } from '@tanstack/react-router'

import { PocketBaseAuthGate } from '@/features/auth/pocketbase-auth-gate'
import { AdaptiveAddFlow, AdaptiveEditFlow } from '@/features/items/add-flow'
import { useAppInterestRepository } from '@/features/items/app-interest-repository'
import { ArchiveScreen } from '@/features/items/archive-screen'
import { DashboardRouteShell } from '@/features/items/dashboard-route-shell'
import { MyPublicListsScreen } from '@/features/items/my-public-lists-screen'
import { PublicListCreateScreen } from '@/features/items/public-list-create-screen'
import { PublicListEditorScreen } from '@/features/items/public-list-editor-screen'
import { McpAuditScreen } from '@/features/mcp/mcp-audit-screen'
import { SettingsScreen } from '@/features/settings/settings-screen'
import { SmartSuggesterFlow } from '@/features/suggester/suggester-flow'

export function DashboardRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const repository = useAppInterestRepository()

  if (pathname === '/dashboard/archive' || pathname === '/dashboard/audit' || pathname === '/dashboard/public-lists' || pathname.startsWith('/dashboard/public-lists/') || pathname === '/dashboard/settings') {
    return <Outlet />
  }

  return (
    <PocketBaseAuthGate>
      <DashboardRouteShell pathname={pathname} repository={repository} routedOverlay={<Outlet />} />
    </PocketBaseAuthGate>
  )
}

export function DashboardAddRoutePage() {
  const navigate = useNavigate()
  const repository = useAppInterestRepository()

  function handleClose() {
    void navigate({ to: '/dashboard' })
  }

  return <AdaptiveAddFlow onCreated={handleClose} onRequestClose={handleClose} repository={repository} />
}

export function DashboardSuggestRoutePage() {
  const navigate = useNavigate()

  function handleClose() {
    void navigate({ to: '/dashboard' })
  }

  return <SmartSuggesterFlow onRequestClose={handleClose} />
}

export function DashboardArchiveRoutePage() {
  const repository = useAppInterestRepository()

  return (
    <PocketBaseAuthGate>
      <ArchiveScreen repository={repository} />
    </PocketBaseAuthGate>
  )
}

export function DashboardAuditRoutePage() {
  return (
    <PocketBaseAuthGate>
      <McpAuditScreen />
    </PocketBaseAuthGate>
  )
}

export function DashboardSettingsRoutePage() {
  const navigate = useNavigate()

  return (
    <PocketBaseAuthGate>
      <SettingsScreen onLoggedOut={() => void navigate({ to: '/' })} />
    </PocketBaseAuthGate>
  )
}

export function DashboardPublicListsRouteLayout() {
  return <Outlet />
}

export function DashboardPublicListsIndexRoutePage() {
  return (
    <PocketBaseAuthGate>
      <MyPublicListsScreen />
    </PocketBaseAuthGate>
  )
}

export function DashboardPublicListCreateRoutePage() {
  return (
    <PocketBaseAuthGate>
      <PublicListCreateScreen />
    </PocketBaseAuthGate>
  )
}

export function DashboardPublicListEditorRoutePage() {
  const params = useParams({ strict: false }) as { listId?: string }

  return (
    <PocketBaseAuthGate>
      <PublicListEditorScreen listId={params.listId ?? ''} />
    </PocketBaseAuthGate>
  )
}

export function DashboardEditRoutePage() {
  const params = useParams({ strict: false }) as { itemId?: string }
  const navigate = useNavigate()
  const repository = useAppInterestRepository()
  const handleClose = () => {
    void navigate({ to: '/dashboard' })
  }

  return (
    <AdaptiveEditFlow
      itemId={params.itemId ?? ''}
      onDeleted={handleClose}
      onRequestClose={handleClose}
      onUpdated={handleClose}
      repository={repository}
    />
  )
}
