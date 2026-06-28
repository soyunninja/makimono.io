import type { CategoryMetadata } from '@/features/items/metadata'
import type { InterestItem } from '@/features/items/types'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { StatusAction } from '@/features/items/status-action'

type InterestCardProps = {
  item: InterestItem
  metadata: CategoryMetadata
  locale: 'en' | 'es'
  startLabel: string
  onAdvance: (item: InterestItem) => void
}

function formatCreatedAt(createdAt: string, locale: 'en' | 'es') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(createdAt))
}

export function InterestCard({ item, metadata, locale, startLabel, onAdvance }: InterestCardProps) {
  return (
    <Card
      className={cn('flex h-full flex-col border-l-4', metadata.cardBorderClassName, metadata.surfaceClassName)}
      role="article"
    >
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <Badge className={metadata.accentClassName} variant="outline">
              {metadata.label}
            </Badge>
            <div className="space-y-2">
              <h2 className="text-balance break-words text-2xl font-semibold tracking-tight text-foreground">
                {item.title}
              </h2>
              <CardDescription>{item.notes ?? metadata.statusActions[item.status]}</CardDescription>
            </div>
          </div>

          <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'secondary' : 'outline'}>
            {metadata.statusLabels[item.status]}
          </Badge>
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

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatCreatedAt(item.createdAt, locale)}
        </p>
      </CardContent>

      <CardFooter className="mt-auto justify-end flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <StatusAction item={item} metadata={metadata} onAdvance={onAdvance} startLabel={startLabel} />
      </CardFooter>
    </Card>
  )
}
