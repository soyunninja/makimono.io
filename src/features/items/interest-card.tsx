import { Play } from 'lucide-react'
import { useState, type MouseEvent } from 'react'

import type { CategoryMetadata } from '@/features/items/metadata'
import { CardCoverBackground } from '@/features/items/card-cover-background'
import type { InterestItem } from '@/features/items/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type InterestCardProps = {
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
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  const showsCompletionControl = item.status === 'in_progress'
  const showsStartAction = item.status === 'pending'
  const completionActionLabel = metadata.statusActions.completed
  const completionControlLabel = `${completionActionLabel}: ${item.title}`
  const startControlLabel = `${startLabel}: ${item.title}`
  const editLinkLabel = `${editLabel}: ${item.title}`

  function handleEditClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!onEdit) {
      return
    }

    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
    ) {
      return
    }

    event.preventDefault()
    onEdit(item)
  }

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
                  onClick={() => setIsCompletionDialogOpen(true)}
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
                  onClick={() => onAdvance(item)}
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
                <CardDescription>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
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

      <Dialog onOpenChange={setIsCompletionDialogOpen} open={isCompletionDialogOpen}>
        <DialogContent closeLabel={closeLabel}>
          <DialogHeader>
            <DialogTitle>{completionActionLabel}</DialogTitle>
            <DialogDescription>{completeWarningLabel}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsCompletionDialogOpen(false)} type="button" variant="outline">
              {cancelLabel}
            </Button>
            <Button
              className={metadata.textClassName}
              onClick={() => {
                setIsCompletionDialogOpen(false)
                onAdvance(item)
              }}
              type="button"
            >
              {completionActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
