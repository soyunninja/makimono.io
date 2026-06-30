import { CircleCheck, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DashboardItemCompletionDialog,
  type DashboardItemInteractionProps,
  useDashboardItemInteractions,
} from '@/features/items/dashboard-item-interactions'
import { cn } from '@/lib/utils'

type DashboardListItemProps = DashboardItemInteractionProps

export function DashboardListItem({
  item,
  metadata,
  startLabel,
  editHref,
  editLabel,
  completeWarningLabel,
  closeLabel,
  cancelLabel,
  onAdvance,
  onEdit,
}: DashboardListItemProps) {
  const {
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
  } = useDashboardItemInteractions({ item, metadata, startLabel, editLabel, onAdvance, onEdit })

  return (
    <>
      <article className={'min-w-0'}>
        <div className={'flex min-w-0 items-center gap-3 py-0 md:py-1'}>
          {showsCompletionControl || showsStartAction ? (
            <Button
              aria-haspopup={showsCompletionControl ? 'dialog' : undefined}
              aria-label={showsCompletionControl ? completionControlLabel : startControlLabel}
              className={cn('shrink-0 rounded-full border-transparent bg-transparent p-0', metadata.textClassName)}
              onClick={handleStatusActionClick}
              size={'icon'}
              type={'button'}
              variant={'ghost'}
            >
              {showsCompletionControl ? (
                <CircleCheck aria-hidden={'true'} className={metadata.textClassName} />
              ) : (
                <Play aria-hidden={'true'} className={metadata.textClassName} fill={'currentColor'} />
              )}
            </Button>
          ) : null}

          <a
            aria-label={editLinkLabel}
            className={cn(
              'min-w-0 flex-1 break-words text-base font-semibold leading-6 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 hover:underline focus-visible:underline',
              metadata.textClassName,
            )}
            href={editHref}
            onClick={handleEditClick}
          >
            {item.title}
          </a>
        </div>
      </article>

      <DashboardItemCompletionDialog
        cancelLabel={cancelLabel}
        closeLabel={closeLabel}
        completeWarningLabel={completeWarningLabel}
        completionActionLabel={completionActionLabel}
        confirmButtonClassName="bg-[#FBA87A] text-black hover:bg-[#FBA87A]/90"
        isOpen={isCompletionDialogOpen}
        onConfirm={handleConfirmCompletion}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </>
  )
}
