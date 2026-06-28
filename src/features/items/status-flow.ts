import type { ItemStatus } from '@/features/items/types'

export function getNextStatus(status: ItemStatus): ItemStatus | null {
  switch (status) {
    case 'pending':
      return 'in_progress'
    case 'in_progress':
      return 'completed'
    case 'completed':
      return null
  }
}

export function canAdvanceStatus(status: ItemStatus): boolean {
  return getNextStatus(status) !== null
}
