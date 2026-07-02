import { describe, expect, it, vi } from 'vitest'

import {
  avatarInputMaxBytes,
  avatarOutputMaxBytes,
  avatarOutputSizePixels,
  normalizeAvatarForStorage,
  validateAvatarInput,
  type AvatarCanvas,
  type AvatarCanvasContext,
} from '@/features/auth/avatar-normalization'

describe('avatar normalization', () => {
  it('accepts only the supported avatar input formats', () => {
    expect([
      validateAvatarInput(createFile('avatar.jpg', 'image/jpeg')),
      validateAvatarInput(createFile('avatar.jpeg', 'image/jpeg')),
      validateAvatarInput(createFile('avatar.png', 'image/png')),
      validateAvatarInput(createFile('avatar.gif', 'image/gif')),
      validateAvatarInput(createFile('avatar.webp', 'image/webp')),
    ]).toEqual([
      { mimeType: 'image/jpeg', ok: true }, { mimeType: 'image/jpeg', ok: true }, { mimeType: 'image/png', ok: true },
      { mimeType: 'image/gif', ok: true }, { mimeType: 'image/webp', ok: true },
    ])
  })

  it('rejects oversized and unsupported avatar inputs before decoding', async () => {
    const decodeImage = vi.fn()

    expect(validateAvatarInput(createFile('huge.png', 'image/png', avatarInputMaxBytes + 1))).toEqual({
      error: 'file_too_large',
      ok: false,
      preservesCurrentAvatar: true,
    })
    expect(validateAvatarInput(createFile('avatar.svg', 'image/svg+xml'))).toEqual({
      error: 'unsupported_type',
      ok: false,
      preservesCurrentAvatar: true,
    })

    await expect(normalizeAvatarForStorage(createFile('avatar.svg', 'image/svg+xml'), { decodeImage })).resolves.toEqual({
      error: 'unsupported_type',
      ok: false,
      preservesCurrentAvatar: true,
    })
    expect(decodeImage).not.toHaveBeenCalled()
  })

  it('center-crops and stores a static 200x200 WebP under the output size cap', async () => {
    const { canvas, drawImage } = createCanvasMock(() => createBlob('image/webp', avatarOutputMaxBytes - 1))
    const imageSource = createImageSource()
    const close = vi.fn()

    const result = await normalizeAvatarForStorage(createFile('wide.png', 'image/png'), {
      createCanvas: () => canvas,
      decodeImage: async () => ({ close, height: 200, source: imageSource, width: 400 }),
      now: () => 42,
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected avatar normalization to succeed.')
    }

    expect(result).toMatchObject({ height: 200, mimeType: 'image/webp', ok: true, width: 200 })
    expect(result.file.name).toBe('avatar.webp')
    expect(result.file.type).toBe('image/webp')
    expect(result.file.size).toBeLessThanOrEqual(avatarOutputMaxBytes)
    expect(result.file.lastModified).toBe(42)
    expect(canvas.width).toBe(avatarOutputSizePixels)
    expect(canvas.height).toBe(avatarOutputSizePixels)
    expect(drawImage).toHaveBeenCalledWith(imageSource, 100, 0, 200, 200, 0, 0, 200, 200)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('stores animated GIF inputs as a single static WebP frame', async () => {
    const { canvas, drawImage } = createCanvasMock(() => createBlob('image/webp', 1024))

    const result = await normalizeAvatarForStorage(createFile('animated.gif', 'image/gif'), {
      createCanvas: () => canvas,
      decodeImage: async () => ({ height: 320, source: createImageSource(), width: 320 }),
    })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      throw new Error('Expected animated GIF normalization to succeed.')
    }

    expect(result.file.type).toBe('image/webp')
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
    expect(drawImage).toHaveBeenCalledTimes(1)
  })

  it('rejects normalized avatars that remain over the stored size cap', async () => {
    const { canvas } = createCanvasMock(() => createBlob('image/webp', avatarOutputMaxBytes + 1))

    await expect(normalizeAvatarForStorage(createFile('avatar.webp', 'image/webp'), {
      createCanvas: () => canvas,
      decodeImage: async () => ({ height: 200, source: createImageSource(), width: 200 }),
    })).resolves.toEqual({
      error: 'normalized_file_too_large',
      ok: false,
      preservesCurrentAvatar: true,
    })
  })

  it('returns a typed failure that preserves the current avatar when canvas drawing fails', async () => {
    const currentAvatarUrl = '/api/files/users/user-current/current.webp'
    const createOutputBlob = vi.fn(() => createBlob('image/webp', 1024))
    const { canvas, drawImage } = createCanvasMock(createOutputBlob)
    const close = vi.fn()

    drawImage.mockImplementation(() => {
      throw new Error('Canvas draw failed.')
    })

    const result = await normalizeAvatarForStorage(createFile('avatar.png', 'image/png'), {
      createCanvas: () => canvas,
      decodeImage: async () => ({ close, height: 200, source: createImageSource(), width: 200 }),
    })
    const nextAvatarUrl = result.ok ? URL.createObjectURL(result.file) : currentAvatarUrl

    expect(result).toEqual({
      error: 'conversion_failed',
      ok: false,
      preservesCurrentAvatar: true,
    })
    expect(nextAvatarUrl).toBe(currentAvatarUrl)
    expect(createOutputBlob).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('returns typed failures that leave the current avatar unchanged', async () => {
    const currentAvatarUrl = '/api/files/users/user-current/current.webp'
    const result = await normalizeAvatarForStorage(createFile('avatar.txt', 'text/plain'))
    const nextAvatarUrl = result.ok ? URL.createObjectURL(result.file) : currentAvatarUrl

    expect(result).toEqual({
      error: 'unsupported_type',
      ok: false,
      preservesCurrentAvatar: true,
    })
    expect(nextAvatarUrl).toBe(currentAvatarUrl)
  })
})

function createFile(name: string, type: string, size = 1024) {
  const file = new File(['avatar'], name, { type })

  Object.defineProperty(file, 'size', {
    configurable: true,
    value: size,
  })

  return file
}

function createBlob(type: string, size: number) {
  const blob = new Blob(['avatar'], { type })

  Object.defineProperty(blob, 'size', {
    configurable: true,
    value: size,
  })

  return blob
}

function createImageSource() {
  return { height: 200, width: 200 } as unknown as CanvasImageSource
}

function createCanvasMock(createOutputBlob: (type: string | undefined, quality: number | undefined) => Blob | null) {
  const drawImage = vi.fn<AvatarCanvasContext['drawImage']>()
  const context = { drawImage } satisfies AvatarCanvasContext
  const canvas = {
    getContext: () => context,
    height: 0,
    toBlob: (callback, type, quality) => callback(createOutputBlob(type, quality)),
    width: 0,
  } satisfies AvatarCanvas

  return { canvas, drawImage }
}
