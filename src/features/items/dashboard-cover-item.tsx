import { CircleCheck, Image, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DashboardItemCompletionDialog,
  type DashboardItemInteractionProps,
  useDashboardItemInteractions,
} from '@/features/items/dashboard-item-interactions'
import { cn } from '@/lib/utils'

type DashboardCoverItemProps = DashboardItemInteractionProps

export function DashboardCoverItem({
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
}: DashboardCoverItemProps) {
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
      <article className={'relative mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm'}>
        <a
          aria-label={editLinkLabel}
          className={'block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'}
          href={editHref}
          onClick={handleEditClick}
        >
          {item.coverImageUrl ? (
            <img
              alt={''}
              className={'block h-auto w-full'}
              data-testid={'dashboard-cover-image'}
              src={item.coverImageUrl}
            />
          ) : (
            <div className={cn('flex aspect-[2/3] min-h-48 w-full items-center justify-center', metadata.surfaceClassName)} data-testid={'dashboard-cover-fallback'}>
              <Image aria-hidden={'true'} className={cn('size-12 opacity-70', metadata.textClassName)} />
            </div>
          )}
        </a>

        {showsCompletionControl || showsStartAction ? (
          <Button
            aria-haspopup={showsCompletionControl ? 'dialog' : undefined}
            aria-label={showsCompletionControl ? completionControlLabel : startControlLabel}
            className={cn(
              'absolute left-3 top-3 z-10 rounded-full border-transparent bg-background/85 p-0 shadow-sm backdrop-blur hover:bg-background/95',
              metadata.textClassName,
            )}
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
