import { Play } from 'lucide-react'

import { CardCoverBackground } from '@/features/items/card-cover-background'
import {
  DashboardItemCompletionDialog,
  type DashboardItemInteractionProps,
  useDashboardItemInteractions,
} from '@/features/items/dashboard-item-interactions'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type InterestCardProps = DashboardItemInteractionProps

export function InterestCard({
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
}: InterestCardProps) {
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
      <Card
        className={cn('relative isolate flex h-full flex-col overflow-hidden border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
        role="article"
      >
        <CardCoverBackground item={item} metadata={metadata} testId="interest-card-cover" />
        <CardContent className="relative z-10 flex flex-1 items-start !gap-0 p-4 xl:p-6">
          {showsCompletionControl || showsStartAction ? (
            <div className="shrink-0 self-start !-translate-x-2 !-translate-y-2.5">
              {showsCompletionControl ? (
                <Button
                  aria-haspopup="dialog"
                  aria-label={completionControlLabel}
                  className={cn(
                    'rounded-full border-transparent bg-transparent p-0',
                    metadata.textClassName,
                  )}
                  onClick={handleStatusActionClick}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <span
                    aria-hidden="true"
                    className={cn('block size-4 rounded-full border-2 border-current bg-transparent text-current', metadata.textClassName)}
                  />
                </Button>
              ) : (
                <Button
                  aria-label={startControlLabel}
                  className={cn(
                    'rounded-full border-transparent bg-transparent p-0',
                    metadata.textClassName,
                  )}
                  onClick={handleStatusActionClick}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Play aria-hidden="true" className={metadata.textClassName} fill="currentColor" />
                </Button>
              )}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className={metadata.accentClassName} variant="outline">
                {metadata.label}
              </Badge>
              <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'secondary' : 'outline'}>
                {metadata.statusLabels[item.status]}
              </Badge>
            </div>

            <a
              aria-label={editLinkLabel}
              className="group -my-2 py-1 flex min-w-0 flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              href={editHref}
              onClick={handleEditClick}
            >
              <div className="min-w-0 space-y-0">
                <h2 className="text-balance break-words text-xl xl:text-2xl font-semibold tracking-tight text-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
                  {item.title}
                </h2>
                <CardDescription className={item.coverImageUrl ? 'text-foreground/80' : undefined}>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
              </div>

              {item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge className="font-mono font-medium" key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </a>
          </div>
        </CardContent>

      </Card>

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
