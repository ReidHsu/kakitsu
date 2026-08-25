/**
 * 圖片處理：
 *   Photo → Resize → Compress (JPEG/WebP) → data URL → IndexedDB
 *
 * 第一版限制最大尺寸與壓縮品質，避免把大型原始圖片塞進 IndexedDB。
 */

export interface ImageProcessOptions {
  /** 最大邊長（px） */
  maxSize?: number
  /** JPEG 壓縮品質 0-1 */
  quality?: number
  /** 目標格式，優先使用 WebP，否則 JPEG */
  format?: 'image/webp' | 'image/jpeg'
}

const DEFAULT_OPTIONS: Required<ImageProcessOptions> = {
  maxSize: 1280,
  quality: 0.8,
  format: 'image/webp',
}

function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

/**
 * 讀取 File / Blob → data URL（用於預覽）
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * 把圖片縮小並壓縮成 data URL。
 * 若不需要縮放，仍會重新壓縮一次以控制大小。
 */
export async function processImage(
  file: File | Blob,
  options: ImageProcessOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const format =
    opts.format === 'image/webp' && !supportsWebP() ? 'image/jpeg' : opts.format

  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(sourceUrl)

    // 以最大邊長等比例縮放
    const scale = Math.min(1, opts.maxSize / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('無法建立 canvas context')

    ctx.drawImage(image, 0, 0, width, height)
    const dataUrl = canvas.toDataURL(format, opts.quality)

    // 保守起見：若壓縮後仍超大，再退回 JPEG 較低品質
    if (dataUrl.length > 4_000_000 && format === 'image/webp') {
      return canvas.toDataURL('image/jpeg', 0.7)
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = src
  })
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
