import { describe, expect, it } from 'vitest'

import { getCategoryMetadata, listCategoryMetadata } from '@/features/items/metadata'

describe('item category metadata', () => {
  it('covers the five first-class categories in English and Spanish', () => {
    expect(listCategoryMetadata('en').map(({ key, label }) => [key, label])).toEqual([
      ['series', 'Series'],
      ['movies', 'Movies'],
      ['games', 'Games'],
      ['books', 'Books'],
      ['webs', 'Websites'],
    ])

    expect(listCategoryMetadata('es').map(({ key, label }) => [key, label])).toEqual([
      ['series', 'Series'],
      ['movies', 'Películas'],
      ['games', 'Juegos'],
      ['books', 'Libros'],
      ['webs', 'Webs'],
    ])
  })

  it('keeps category-specific completion verbs', () => {
    expect(getCategoryMetadata('books', 'en').statusActions.completed).toBe('Mark as read')
    expect(getCategoryMetadata('movies', 'es').statusActions.completed).toBe('Marcar como vista')
  })
})
