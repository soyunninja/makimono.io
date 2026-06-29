import { useEffect, useRef, useState, type ReactNode } from 'react'

import {
  AdaptiveAddFlow,
  AdaptiveEditFlow,
} from '@/features/items/add-flow'
import { DashboardScreen } from '@/features/items/dashboard-screen'
import type { InterestRepository } from '@/features/items/types'
import { SmartSuggesterFlow } from '@/features/suggester/suggester-flow'

type DashboardRouteShellProps = {
  pathname: string
  repository: InterestRepository
  routedOverlay: ReactNode
}

function isDashboardOverlayPath(pathname: string) {
  return pathname === '/dashboard/add'
    || pathname === '/dashboard/suggest'
    || pathname.startsWith('/dashboard/edit/')
}

export function DashboardRouteShell({ pathname, repository, routedOverlay }: DashboardRouteShellProps) {
  const previousPathnameRef = useRef(pathname)
  const [reloadKey, setReloadKey] = useState(0)
  const [isAddFlowOpen, setIsAddFlowOpen] = useState(false)
  const [isSuggestFlowOpen, setIsSuggestFlowOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  function closeLocalOverlays() {
    setIsAddFlowOpen(false)
    setIsSuggestFlowOpen(false)
    setEditingItemId(null)
  }

  function refreshDashboardItems() {
    setReloadKey((currentValue) => currentValue + 1)
  }

  function handleLocalAddOpen() {
    setIsSuggestFlowOpen(false)
    setEditingItemId(null)
    setIsAddFlowOpen(true)
  }

  function handleLocalSuggestOpen() {
    setIsAddFlowOpen(false)
    setEditingItemId(null)
    setIsSuggestFlowOpen(true)
  }

  function handleEditItem(itemId: string) {
    setIsAddFlowOpen(false)
    setIsSuggestFlowOpen(false)
    setEditingItemId(itemId)
  }

  function handleLocalMutation() {
    refreshDashboardItems()
    closeLocalOverlays()
  }

  useEffect(() => {
    if (pathname !== '/dashboard') {
      closeLocalOverlays()
    }
  }, [pathname])

  useEffect(() => {
    const previousPathname = previousPathnameRef.current

    if (pathname === '/dashboard' && isDashboardOverlayPath(previousPathname)) {
      refreshDashboardItems()
    }

    previousPathnameRef.current = pathname
  }, [pathname])

  const showsLocalOverlays = pathname === '/dashboard'

  return (
    <>
      <DashboardScreen
        onAddItem={showsLocalOverlays ? handleLocalAddOpen : undefined}
        onEditItem={showsLocalOverlays ? handleEditItem : undefined}
        onSuggestItem={showsLocalOverlays ? handleLocalSuggestOpen : undefined}
        repository={repository}
        reloadKey={reloadKey}
      />
      {showsLocalOverlays && isAddFlowOpen ? (
        <AdaptiveAddFlow onCreated={handleLocalMutation} onRequestClose={closeLocalOverlays} repository={repository} />
      ) : null}
      {showsLocalOverlays && isSuggestFlowOpen ? (
        <SmartSuggesterFlow onRequestAdd={handleLocalAddOpen} onRequestClose={closeLocalOverlays} />
      ) : null}
      {showsLocalOverlays && editingItemId ? (
        <AdaptiveEditFlow
          itemId={editingItemId}
          onDeleted={handleLocalMutation}
          onRequestClose={closeLocalOverlays}
          repository={repository}
          onUpdated={handleLocalMutation}
        />
      ) : null}
      {routedOverlay}
    </>
  )
}
