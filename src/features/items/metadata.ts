import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/types'

import { itemCategories, type Category, type ItemStatus } from '@/features/items/types'

const categoryAppearance: Record<
  Category,
  {
    accentToken: string
    accentClassName: string
    controlClassName: string
    surfaceClassName: string
    textClassName: string
    cardBorderClassName: string
  }
> = {
  series: {
    accentToken: 'accent-purple',
    accentClassName: 'border-accent-purple/30 bg-accent-purple/10 text-accent-purple',
    controlClassName:
      'border-accent-purple/40 text-accent-purple hover:border-accent-purple/60 hover:bg-accent-purple/10 hover:text-accent-purple',
    surfaceClassName: 'border-accent-purple/30 bg-accent-purple/10',
    textClassName: 'text-accent-purple',
    cardBorderClassName: 'border-l-accent-purple',
  },
  movies: {
    accentToken: 'accent-red',
    accentClassName: 'border-accent-red/30 bg-accent-red/10 text-accent-red',
    controlClassName:
      'border-accent-red/40 text-accent-red hover:border-accent-red/60 hover:bg-accent-red/10 hover:text-accent-red',
    surfaceClassName: 'border-accent-red/30 bg-accent-red/10',
    textClassName: 'text-accent-red',
    cardBorderClassName: 'border-l-accent-red',
  },
  games: {
    accentToken: 'accent-green',
    accentClassName: 'border-accent-green/30 bg-accent-green/10 text-accent-green',
    controlClassName:
      'border-accent-green/40 text-accent-green hover:border-accent-green/60 hover:bg-accent-green/10 hover:text-accent-green',
    surfaceClassName: 'border-accent-green/30 bg-accent-green/10',
    textClassName: 'text-accent-green',
    cardBorderClassName: 'border-l-accent-green',
  },
  books: {
    accentToken: 'accent-yellow',
    accentClassName: 'border-accent-yellow/30 bg-accent-yellow/10 text-accent-yellow',
    controlClassName:
      'border-accent-yellow/40 text-accent-yellow hover:border-accent-yellow/60 hover:bg-accent-yellow/10 hover:text-accent-yellow',
    surfaceClassName: 'border-accent-yellow/30 bg-accent-yellow/10',
    textClassName: 'text-accent-yellow',
    cardBorderClassName: 'border-l-accent-yellow',
  },
  music: {
    accentToken: 'accent-blue',
    accentClassName: 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
    controlClassName:
      'border-accent-blue/40 text-accent-blue hover:border-accent-blue/60 hover:bg-accent-blue/10 hover:text-accent-blue',
    surfaceClassName: 'border-accent-blue/30 bg-accent-blue/10',
    textClassName: 'text-accent-blue',
    cardBorderClassName: 'border-l-accent-blue',
  },
}

export type CategoryMetadata = {
  key: Category
  label: string
  accentToken: string
  accentClassName: string
  controlClassName: string
  surfaceClassName: string
  textClassName: string
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
    controlClassName: appearance.controlClassName,
    surfaceClassName: appearance.surfaceClassName,
    textClassName: appearance.textClassName,
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
