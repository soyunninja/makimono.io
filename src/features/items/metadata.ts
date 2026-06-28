import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/types'

import { itemCategories, type Category, type ItemStatus } from '@/features/items/types'

const categoryAppearance: Record<
  Category,
  { accentToken: string; accentClassName: string; cardBorderClassName: string }
> = {
  series: {
    accentToken: 'accent-purple',
    accentClassName: 'border-accent-purple/30 bg-accent-purple/10 text-accent-purple',
    cardBorderClassName: 'border-l-accent-purple',
  },
  movies: {
    accentToken: 'accent-red',
    accentClassName: 'border-accent-red/30 bg-accent-red/10 text-accent-red',
    cardBorderClassName: 'border-l-accent-red',
  },
  games: {
    accentToken: 'accent-green',
    accentClassName: 'border-accent-green/30 bg-accent-green/10 text-accent-green',
    cardBorderClassName: 'border-l-accent-green',
  },
  books: {
    accentToken: 'accent-yellow',
    accentClassName: 'border-accent-yellow/30 bg-accent-yellow/10 text-accent-yellow',
    cardBorderClassName: 'border-l-accent-yellow',
  },
  webs: {
    accentToken: 'accent-cyan',
    accentClassName: 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan',
    cardBorderClassName: 'border-l-accent-cyan',
  },
}

export type CategoryMetadata = {
  key: Category
  label: string
  accentToken: string
  accentClassName: string
  cardBorderClassName: string
  statusLabels: Record<ItemStatus, string>
  statusActions: Record<ItemStatus, string>
}

export function listCategoryMetadata(locale: Locale): CategoryMetadata[] {
  return itemCategories.map((category) => getCategoryMetadata(category, locale))
}

export function getCategoryMetadata(category: Category, locale: Locale): CategoryMetadata {
  const dictionary = getDictionary(locale)
  const appearance = categoryAppearance[category]

  return {
    key: category,
    label: dictionary.categories[category],
    accentToken: appearance.accentToken,
    accentClassName: appearance.accentClassName,
    cardBorderClassName: appearance.cardBorderClassName,
    statusLabels: {
      pending: dictionary.status.pending,
      in_progress: dictionary.status.in_progress,
      completed: dictionary.status.completed,
    },
    statusActions: {
      pending: dictionary.actions[category].pending,
      in_progress: dictionary.actions[category].in_progress,
      completed: dictionary.actions[category].completed,
    },
  }
}
