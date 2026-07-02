export type AvatarNormalizationError =
  | 'browser_unsupported'
  | 'canvas_unavailable'
  | 'conversion_failed'
  | 'file_too_large'
  | 'normalized_file_too_large'
  | 'unsupported_type'

export type SupportedAvatarInputType = 'image/gif' | 'image/jpeg' | 'image/png' | 'image/webp'

export type AvatarValidationResult =
  | { mimeType: SupportedAvatarInputType, ok: true }
  | { error: 'file_too_large' | 'unsupported_type', ok: false, preservesCurrentAvatar: true }

export type AvatarNormalizationResult =
  | { file: File, height: typeof avatarOutputSizePixels, mimeType: 'image/webp', ok: true, width: typeof avatarOutputSizePixels }
  | { error: AvatarNormalizationError, ok: false, preservesCurrentAvatar: true }

export type AvatarCanvasContext = {
  drawImage: (image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void
}

export type AvatarCanvas = {
  getContext: (contextId: '2d') => AvatarCanvasContext | null
  height: number
  toBlob: HTMLCanvasElement['toBlob']
  width: number
}

export type DecodedAvatarImage = {
  close?: () => void
  height: number
  source: CanvasImageSource
  width: number
}

export type AvatarNormalizationDependencies = {
  createCanvas?: () => AvatarCanvas | null
  createStoredFile?: (parts: BlobPart[], fileName: string, options: FilePropertyBag) => File
  decodeImage?: (file: File) => Promise<DecodedAvatarImage>
  now?: () => number
}

export const avatarInputMaxBytes = 5 * 1024 * 1024
export const avatarOutputMaxBytes = 200 * 1024
export const avatarOutputSizePixels = 200

const avatarOutputMimeType = 'image/webp'
const webpQualityAttempts = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56] as const

const supportedAvatarInputTypes = new Set<SupportedAvatarInputType>([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function validateAvatarInput(file: File): AvatarValidationResult {
  if (file.size > avatarInputMaxBytes) {
    return failure('file_too_large')
  }

  const mimeType = resolveSupportedAvatarInputType(file)

  if (!mimeType) {
    return failure('unsupported_type')
  }

  return { mimeType, ok: true }
}

export async function normalizeAvatarForStorage(
  file: File,
  dependencies: AvatarNormalizationDependencies = {},
): Promise<AvatarNormalizationResult> {
  const validation = validateAvatarInput(file)

  if (!validation.ok) {
    return validation
  }

  const decodeImage = dependencies.decodeImage ?? decodeAvatarImage
  const createCanvas = dependencies.createCanvas ?? createBrowserCanvas
  const createStoredFile = dependencies.createStoredFile ?? createBrowserFile
  const now = dependencies.now ?? Date.now

  let decodedImage: DecodedAvatarImage

  try {
    decodedImage = await decodeImage(file)
  } catch {
    return failure('browser_unsupported')
  }

  try {
    const canvas = createCanvas()

    if (!canvas) {
      return failure('canvas_unavailable')
    }

    canvas.width = avatarOutputSizePixels
    canvas.height = avatarOutputSizePixels

    const context = canvas.getContext('2d')

    if (!context) {
      return failure('canvas_unavailable')
    }

    const sourceSize = Math.min(decodedImage.width, decodedImage.height)
    const sourceX = (decodedImage.width - sourceSize) / 2
    const sourceY = (decodedImage.height - sourceSize) / 2

    context.drawImage(
      decodedImage.source,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      avatarOutputSizePixels,
      avatarOutputSizePixels,
    )

    const outputBlobResult = await createCappedWebPBlob(canvas)

    if (!outputBlobResult.ok) {
      return failure(outputBlobResult.error)
    }

    const outputFile = createStoredFile([outputBlobResult.blob], 'avatar.webp', {
      lastModified: now(),
      type: avatarOutputMimeType,
    })

    return {
      file: outputFile,
      height: avatarOutputSizePixels,
      mimeType: avatarOutputMimeType,
      ok: true,
      width: avatarOutputSizePixels,
    }
  } catch {
    return failure('conversion_failed')
  } finally {
    closeDecodedAvatarImage(decodedImage)
  }
}

function resolveSupportedAvatarInputType(file: File) {
  const normalizedMimeType = file.type.trim().toLowerCase()

  return isSupportedAvatarInputType(normalizedMimeType) ? normalizedMimeType : null
}

function isSupportedAvatarInputType(value: string): value is SupportedAvatarInputType {
  return supportedAvatarInputTypes.has(value as SupportedAvatarInputType)
}

async function createCappedWebPBlob(canvas: AvatarCanvas) {
  for (const quality of webpQualityAttempts) {
    const blob = await canvasToBlob(canvas, avatarOutputMimeType, quality)

    if (!blob || blob.type !== avatarOutputMimeType) {
      return { error: 'conversion_failed' as const, ok: false as const }
    }

    if (blob.size <= avatarOutputMaxBytes) {
      return { blob, ok: true as const }
    }
  }

  return { error: 'normalized_file_too_large' as const, ok: false as const }
}

function canvasToBlob(canvas: AvatarCanvas, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

async function decodeAvatarImage(file: File): Promise<DecodedAvatarImage> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Browser image APIs are unavailable.')
  }

  const imageBitmap = await createImageBitmap(file)

  return {
    close: () => imageBitmap.close(),
    height: imageBitmap.height,
    source: imageBitmap,
    width: imageBitmap.width,
  }
}

function createBrowserCanvas() {
  if (typeof document === 'undefined') {
    return null
  }

  return document.createElement('canvas')
}

function createBrowserFile(parts: BlobPart[], fileName: string, options: FilePropertyBag) {
  return new File(parts, fileName, options)
}

function closeDecodedAvatarImage(decodedImage: DecodedAvatarImage) {
  try {
    decodedImage.close?.()
  } catch {
    // Preserve the normalization result even if browser image cleanup fails.
  }
}

function failure<TError extends AvatarNormalizationError>(error: TError) {
  return { error, ok: false as const, preservesCurrentAvatar: true as const }
}
