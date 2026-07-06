import { describe, expect, it } from 'vitest'

import { formatPublicListDisplayDate } from '@/features/items/public-list-date-format'

describe('formatPublicListDisplayDate', () => {
  it('formats ISO and date-only public list dates without exposing raw timestamps', () => {
    expect(formatPublicListDisplayDate('2026-07-03 00:00:00.000Z', 'es')).toBe('03 de julio de 2026')
    expect(formatPublicListDisplayDate('2026-07-03', 'es')).toBe('03 de julio de 2026')
    expect(formatPublicListDisplayDate('not-a-date', 'es')).toBe('not-a-date')
  })
})
