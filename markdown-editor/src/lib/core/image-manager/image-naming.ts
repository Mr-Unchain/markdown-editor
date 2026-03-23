import { getExtensionFromMime } from './image-validator'

/**
 * Image naming utilities (BR-U4-08)
 * Generates unique filenames for images stored in {filename}.assets/ folders.
 */

/**
 * Generate a unique image filename.
 * Format: yyyyMMdd-HHmmss-{random6}.{ext}
 */
export function generateImageFilename(mimeType: string): string {
  const now = new Date()
  const datePart = formatDate(now)
  const randomPart = generateRandomHex(6)
  const ext = getExtensionFromMime(mimeType)
  return `${datePart}-${randomPart}.${ext}`
}

/**
 * Get the assets directory path for a markdown file.
 * Convention: {filename}.assets/ co-located with the markdown file (Typora-style).
 */
export function getAssetsDir(markdownFilePath: string): string {
  // Remove .md extension and add .assets
  const baseName = markdownFilePath.replace(/\.md$/i, '')
  return `${baseName}.assets`
}

/**
 * Build the full local path for an image.
 */
export function buildImageLocalPath(markdownFilePath: string, imageFilename: string): string {
  const assetsDir = getAssetsDir(markdownFilePath)
  return `${assetsDir}/${imageFilename}`
}

/**
 * Build a relative markdown image reference.
 */
export function buildMarkdownImageRef(markdownFilePath: string, imageFilename: string): string {
  const dirName = getAssetsDir(markdownFilePath).split('/').pop() ?? 'assets'
  return `./${dirName}/${imageFilename}`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}-${h}${min}${s}`
}

function generateRandomHex(length: number): string {
  const array = new Uint8Array(Math.ceil(length / 2))
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}
