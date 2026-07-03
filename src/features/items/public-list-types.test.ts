import { describe, expect, it } from 'vitest'

import {
  derivePublicOwnerNamespace,
  normalizePublicListSlug,
  normalizePublicOwnerNamespace,
} from '@/features/items/public-list-types'

describe('public list route helpers', () => {
  it('normalizes slugs and owner namespaces to lowercase dash-separated route parts', () => {
    expect(normalizePublicListSlug('  Summer Books!  ')).toEqual({ ok: true, value: 'summer-books' })
    expect(normalizePublicOwnerNamespace(' Ana_María 99 ')).toEqual({ ok: true, value: 'ana-maria-99' })
  })

  it('derives the public namespace from username before the email prefix', () => {
    expect(derivePublicOwnerNamespace({ email: 'private@example.com', username: 'Ana Reader' })).toEqual({
      ok: true,
      value: 'ana-reader',
    })
  })

  it('falls back to the normalized email prefix without exposing the full email', () => {
    const namespace = derivePublicOwnerNamespace({ email: 'Sam.Reader@example.com' })

    expect(namespace).toEqual({ ok: true, value: 'sam-reader' })
    expect(JSON.stringify(namespace)).not.toContain('example.com')
  })

  it('rejects route parts that are empty after normalization', () => {
    expect(normalizePublicListSlug(' !@#$ ')).toEqual({ error: 'empty', ok: false, value: '' })
    expect(derivePublicOwnerNamespace({ email: '@example.com' })).toEqual({ error: 'empty', ok: false, value: '' })
  })
})
