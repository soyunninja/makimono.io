import { useState } from 'react'

import type { CategoryMetadata } from '@/features/items/metadata'
import type { InterestItem } from '@/features/items/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type InterestCardProps = {
  item: InterestItem
  metadata: CategoryMetadata
  startLabel: string
  editHref: string
  editLabel: string
  deleteLabel: string
  completeWarningLabel: string
  closeLabel: string
  cancelLabel: string
  onAdvance: (item: InterestItem) => void
  onDelete: (item: InterestItem) => void
}

export function InterestCard({
  item,
  metadata,
  startLabel,
  editHref,
  editLabel,
  deleteLabel,
  completeWarningLabel,
  closeLabel,
  cancelLabel,
  onAdvance,
  onDelete,
}: InterestCardProps) {
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  const showsCompletionControl = item.status === 'in_progress'
  const showsStartAction = item.status === 'pending'
  const completionActionLabel = metadata.statusActions.completed
  const completionControlLabel = `${completionActionLabel}: ${item.title}`

  return (
    <>
      <Card
        className={cn('flex h-full flex-col border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
        role="article"
      >
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Badge className={metadata.accentClassName} variant="outline">
              {metadata.label}
            </Badge>

            <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'secondary' : 'outline'}>
              {metadata.statusLabels[item.status]}
            </Badge>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-balance break-words text-2xl font-semibold tracking-tight text-foreground">
                {item.title}
              </h2>
              <CardDescription>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
            </div>

            {showsCompletionControl ? (
              <Button
                aria-haspopup="dialog"
                aria-label={completionControlLabel}
                className={cn('shrink-0 rounded-full border-2 bg-background/80', metadata.controlClassName)}
                onClick={() => setIsCompletionDialogOpen(true)}
                size="icon"
                type="button"
                variant="outline"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border-2 border-current text-current transition-transform',
                    metadata.textClassName,
                  )}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full bg-current opacity-60" />
                </span>
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge className="font-mono font-medium" key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="mt-auto flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className={cn('w-full sm:w-auto', metadata.textClassName)} type="button" variant="ghost">
              <a href={editHref}>{editLabel}</a>
            </Button>
            <Button
              className="w-full sm:w-auto border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(item)}
              type="button"
              variant="outline"
            >
              {deleteLabel}
            </Button>
          </div>

          {showsStartAction ? (
            <Button className="w-full sm:w-auto" onClick={() => onAdvance(item)} type="button">
              {startLabel}
            </Button>
          ) : null}
        </CardFooter>
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
