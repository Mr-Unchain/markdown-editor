import { describe, it, expect } from 'vitest'
import {
  validateImage,
  validateImageBlob,
  getExtensionFromMime,
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '../image-validator'

function createMockFile(name: string, type: string, size: number): File {
  const content = new ArrayBuffer(size)
  return new File([content], name, { type })
}

describe('image-validator', () => {
  describe('validateImage', () => {
    it('accepts valid PNG file', () => {
      const file = createMockFile('test.png', 'image/png', 1024)
      expect(validateImage(file).valid).toBe(true)
    })

    it('accepts valid JPEG file', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      expect(validateImage(file).valid).toBe(true)
    })

    it('accepts valid GIF file', () => {
      const file = createMockFile('test.gif', 'image/gif', 1024)
      expect(validateImage(file).valid).toBe(true)
    })

    it('accepts valid WebP file', () => {
      const file = createMockFile('test.webp', 'image/webp', 1024)
      expect(validateImage(file).valid).toBe(true)
    })

    it('rejects unsupported MIME type', () => {
      const file = createMockFile('test.svg', 'image/svg+xml', 1024)
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('サポートされていない画像形式')
    })

    it('rejects file over 5MB', () => {
      const file = createMockFile('large.png', 'image/png', MAX_IMAGE_SIZE_BYTES + 1)
      const result = validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('大きすぎます')
    })

    it('accepts file exactly at 5MB limit', () => {
      const file = createMockFile('exact.png', 'image/png', MAX_IMAGE_SIZE_BYTES)
      expect(validateImage(file).valid).toBe(true)
    })
  })

  describe('validateImageBlob', () => {
    it('validates blob with explicit MIME type', () => {
      const blob = new Blob([new ArrayBuffer(1024)], { type: 'image/png' })
      expect(validateImageBlob(blob, 'image/png').valid).toBe(true)
    })
  })

  describe('getExtensionFromMime', () => {
    it('maps png', () => expect(getExtensionFromMime('image/png')).toBe('png'))
    it('maps jpeg', () => expect(getExtensionFromMime('image/jpeg')).toBe('jpg'))
    it('maps gif', () => expect(getExtensionFromMime('image/gif')).toBe('gif'))
    it('maps webp', () => expect(getExtensionFromMime('image/webp')).toBe('webp'))
    it('defaults to png for unknown', () => expect(getExtensionFromMime('unknown')).toBe('png'))
  })

  describe('constants', () => {
    it('has 4 allowed MIME types', () => {
      expect(ALLOWED_MIME_TYPES).toHaveLength(4)
    })

    it('MAX_IMAGE_SIZE_BYTES is 5MB', () => {
      expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024)
    })
  })
})
