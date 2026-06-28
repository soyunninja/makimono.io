import { describe, expect, it } from 'vitest'

import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'

describe('item category metadata', () => {
  it('covers the five first-class categories in English and Spanish', () => {
    expect(listCategoryMetadata('en').map(({ key, label }) => [key, label])).toEqual([
      ['series', 'Series'],
      ['movies', 'Movies'],
      ['games', 'Games'],
      ['books', 'Books'],
      ['music', 'Music'],
    ])

    expect(listCategoryMetadata('es').map(({ key, label }) => [key, label])).toEqual([
      ['series', 'Series'],
      ['movies', 'Películas'],
      ['games', 'Juegos'],
      ['books', 'Libros'],
      ['music', 'Música'],
    ])
  })

  it('keeps category-specific completion verbs', () => {
    expect(getCategoryMetadata('books', 'en').statusActions.completed).toBe('Mark as read')
    expect(getCategoryMetadata('music', 'en').statusActions.completed).toBe('Mark as listened')
    expect(getCategoryMetadata('movies', 'es').statusActions.completed).toBe('Marcar como vista')
  })

  it('centralizes the category color contract for badges, controls, and surfaces', () => {
    const expectedAccents = {
      series: 'purple',
      movies: 'red',
      games: 'green',
      books: 'yellow',
      music: 'blue',
    } as const

    for (const [category, accent] of Object.entries(expectedAccents)) {
      const metadata = getCategoryMetadata(category as keyof typeof expectedAccents, 'en')

      expect(metadata.accentToken).toBe(`accent-${accent}`)
      expect(metadata.accentClassName).toContain(`text-accent-${accent}`)
      expect(metadata.controlClassName).toContain(`border-accent-${accent}/40`)
      expect(metadata.surfaceClassName).toContain(`bg-accent-${accent}/10`)
      expect(metadata.textClassName).toBe(`text-accent-${accent}`)
      expect(metadata.cardBorderClassName).toBe(`border-l-accent-${accent}`)
    }
  })
})
