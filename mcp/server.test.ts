import { describe, expect, it } from 'vitest'

import { buildUpdateInterestPayload, filterInterests } from './server'
import type { InterestItem } from '../src/features/items/types'

const items: InterestItem[] = [
  {
    id: 'one',
    category: 'books',
    title: 'Clean Architecture',
    status: 'pending',
    tags: ['architecture'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'two',
    category: 'games',
    title: 'Outer Wilds',
    status: 'completed',
    tags: ['space'],
    createdAt: '2026-01-02T00:00:00.000Z',
    deletedAt: '2026-01-03T00:00:00.000Z',
  },
]

describe('filterInterests', () => {
  it('excludes soft-deleted interests by default', () => {
    expect(filterInterests(items, {})).toEqual([items[0]])
  })

  it('can include soft-deleted interests', () => {
    expect(filterInterests(items, { includeDeleted: true })).toEqual(items)
  })

  it('filters by title, category, or tag', () => {
    expect(filterInterests(items, { includeDeleted: true, query: 'space' })).toEqual([items[1]])
    expect(filterInterests(items, { includeDeleted: true, query: 'book' })).toEqual([items[0]])
    expect(filterInterests(items, { includeDeleted: true, query: 'wilds' })).toEqual([items[1]])
  })
})

describe('buildUpdateInterestPayload', () => {
  it('builds title, notes, and normalized tags for editable fields', () => {
    expect(buildUpdateInterestPayload({
      notes: '  Read the second edition.  ',
      tags: [' architecture ', 'books', 'architecture', ' '],
      title: '  Clean Architecture Updated  ',
    })).toEqual({
      notes: 'Read the second edition.',
      tags: ['architecture', 'books'],
      title: 'Clean Architecture Updated',
    })
  })

  it('clears notes when an empty string is provided', () => {
    expect(buildUpdateInterestPayload({ notes: '' })).toEqual({ notes: null })
    expect(buildUpdateInterestPayload({ notes: '   ' })).toEqual({ notes: null })
  })

  it('rejects updates without editable fields', () => {
    expect(() => buildUpdateInterestPayload({})).toThrow('Provide at least one editable field')
    expect(() => buildUpdateInterestPayload({ notes: undefined, tags: undefined, title: undefined })).toThrow('Provide at least one editable field')
  })

  it('rejects empty titles when a title is provided', () => {
    expect(() => buildUpdateInterestPayload({ title: '   ' })).toThrow('Title must not be empty')
  })
})
