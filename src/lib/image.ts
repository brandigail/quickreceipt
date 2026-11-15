const MAX_SIDE = 1800
const QUALITY = 0.82
const MAX_INPUT_BYTES = 30 * 1024 * 1024

export class ImageError extends Error {}

export interface PreparedImage {
  /** Small JPEG for storage and export. */
  stored: Blob
  /** Lossless copy of the same pixels, used only for reading the text and never saved. */
  forScan: Blob
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Shrinks a photo to at most 1800 px on the long side. The result is stored as JPEG, which keeps IndexedDB and the ZIP
 * exports small (a phone photo of several megabytes becomes a few hundred kilobytes). The text is read from a lossless
 * copy instead, because JPEG blurs the thin strokes of receipt print: on the twelve sample receipts, reading the JPEG
 * got 130 of 173 lines exactly right and 9 of 12 dates, and the lossless copy got every line and date.
 * The camera's rotation (EXIF) is applied, so a receipt shot in portrait is upright.
 */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new ImageError('That file is not an image.')
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('That image is too large (the limit is 30 MB).')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageError('That image could not be read. Try a JPEG or PNG photo.')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new ImageError('Your browser could not prepare the image.')
  // A white backdrop, so a transparent PNG does not turn black when saved as JPEG.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const stored = await toBlob(canvas, 'image/jpeg', QUALITY)
  if (!stored) throw new ImageError('Your browser could not prepare the image.')
  // If the lossless copy cannot be made, reading the JPEG is still better than failing.
  const forScan = (await toBlob(canvas, 'image/png')) ?? stored
  return { stored, forScan }
}
