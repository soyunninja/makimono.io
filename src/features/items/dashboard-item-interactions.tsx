import { useState, type MouseEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CategoryMetadata } from '@/features/items/metadata'
import type { InterestItem } from '@/features/items/types'

export type DashboardItemInteractionProps = {
  item: InterestItem
  metadata: CategoryMetadata
  startLabel: string
  editHref: string
  editLabel: string
  completeWarningLabel: string
  closeLabel: string
  cancelLabel: string
  onAdvance: (item: InterestItem) => void
  onEdit?: (item: InterestItem) => void
}

type DashboardItemInteractionOptions = Pick<
  DashboardItemInteractionProps,
  'item' | 'metadata' | 'startLabel' | 'editLabel' | 'onAdvance' | 'onEdit'
>

type DashboardItemCompletionDialogProps = {
  cancelLabel: string
  closeLabel: string
  completeWarningLabel: string
  completionActionLabel: string
  confirmButtonClassName?: string
  isOpen: boolean
  onConfirm: () => void
  onOpenChange: (isOpen: boolean) => void
}

function shouldHandleEditClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.altKey
    || event.ctrlKey
    || event.shiftKey
  )
}

export function useDashboardItemInteractions({
  item,
  metadata,
  startLabel,
  editLabel,
  onAdvance,
  onEdit,
}: DashboardItemInteractionOptions) {
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  const showsCompletionControl = item.status === 'in_progress'
  const showsStartAction = item.status === 'pending'
  const completionActionLabel = metadata.statusActions.completed
  const completionControlLabel = `${completionActionLabel}: ${item.title}`
  const startControlLabel = `${startLabel}: ${item.title}`
  const editLinkLabel = `${editLabel}: ${item.title}`

  function handleEditClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!onEdit || !shouldHandleEditClick(event)) {
      return
    }

    event.preventDefault()
    onEdit(item)
  }

  function handleStatusActionClick() {
    if (showsCompletionControl) {
      setIsCompletionDialogOpen(true)
      return
    }

    onAdvance(item)
  }

  function handleConfirmCompletion() {
    setIsCompletionDialogOpen(false)
    onAdvance(item)
  }

  return {
    completionActionLabel,
    completionControlLabel,
    editLinkLabel,
    handleConfirmCompletion,
    handleEditClick,
    handleStatusActionClick,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    showsCompletionControl,
    showsStartAction,
    startControlLabel,
  }
}

export function DashboardItemCompletionDialog({
  cancelLabel,
  closeLabel,
  completeWarningLabel,
  completionActionLabel,
  confirmButtonClassName,
  isOpen,
  onConfirm,
  onOpenChange,
}: DashboardItemCompletionDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle>{completionActionLabel}</DialogTitle>
          <DialogDescription>{completeWarningLabel}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type={'button'} variant={'outline'}>
            {cancelLabel}
          </Button>
          <Button className={confirmButtonClassName} onClick={onConfirm} type={'button'}>
            {completionActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
