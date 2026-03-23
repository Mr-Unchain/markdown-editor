/**
 * Image validation (BR-U4-06, BR-U4-07, BR-U4-08)
 */

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate image file type and size.
 */
export function validateImage(file: File): ImageValidationResult {
  if (!isAllowedMimeType(file.type)) {
    return {
      valid: false,
      error: `サポートされていない画像形式です: ${file.type}。対応形式: PNG, JPG, GIF, WebP`,
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `画像ファイルが大きすぎます: ${sizeMB}MB（上限: 5MB）`,
    }
  }

  return { valid: true }
}

/**
 * Validate image from blob with explicit MIME type.
 */
export function validateImageBlob(blob: Blob, mimeType: string): ImageValidationResult {
  if (!isAllowedMimeType(mimeType)) {
    return {
      valid: false,
      error: `サポートされていない画像形式です: ${mimeType}。対応形式: PNG, JPG, GIF, WebP`,
    }
  }

  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `画像ファイルが大きすぎます: ${sizeMB}MB（上限: 5MB）`,
    }
  }

  return { valid: true }
}

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type)
}

/**
 * Get file extension from MIME type.
 */
export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mimeType] ?? 'png'
}

export { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES }
