import type { CategoryMetadata } from '@/features/items/metadata'
import type { InterestItem } from '@/features/items/types'

import { Button } from '@/components/ui/button'

import { canAdvanceStatus } from '@/features/items/status-flow'

type StatusActionProps = {
  item: InterestItem
  metadata: CategoryMetadata
  startLabel: string
  onAdvance: (item: InterestItem) => void
}

export function StatusAction({ item, metadata, startLabel, onAdvance }: StatusActionProps) {
  if (item.status === 'completed') {
    return (
      <Button className="w-full sm:w-auto" disabled variant="secondary">
        {metadata.statusLabels.completed}
      </Button>
    )
  }

  const label = item.status === 'pending' ? startLabel : metadata.statusActions.completed

  return (
    <Button
      className="w-full sm:w-auto"
      onClick={() => onAdvance(item)}
      type="button"
      variant={canAdvanceStatus(item.status) && item.status === 'in_progress' ? 'default' : 'outline'}
    >
      {label}
    </Button>
  )
}
