import type { CategoryMetadata } from '@/features/items/metadata'
import type { InterestItem } from '@/features/items/types'

import { cn } from '@/lib/utils'

type CardCoverBackgroundProps = {
  item: InterestItem
  metadata: CategoryMetadata
  testId: string
}

export function CardCoverBackground({ item, metadata, testId }: CardCoverBackgroundProps) {
  if (!item.coverImageUrl) {
    return null
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" data-testid={testId}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{ backgroundImage: `url("${item.coverImageUrl}")` }}
      />
      <div className={cn('absolute inset-0', metadata.surfaceClassName)} />
      <div className="absolute inset-0 bg-gradient-to-br from-background/15 via-background/55 to-background/80" />
    </div>
  )
}
