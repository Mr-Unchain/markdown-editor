import { describe, it, expect } from 'vitest'
import {
  generateImageFilename,
  getAssetsDir,
  buildImageLocalPath,
  buildMarkdownImageRef,
} from '../image-naming'

describe('image-naming', () => {
  describe('generateImageFilename', () => {
    it('generates filename with date pattern and extension', () => {
      const filename = generateImageFilename('image/png')
      // Pattern: yyyyMMdd-HHmmss-xxxxxx.ext
      expect(filename).toMatch(/^\d{8}-\d{6}-[a-f0-9]{6}\.png$/)
    })

    it('uses correct extension for JPEG', () => {
      const filename = generateImageFilename('image/jpeg')
      expect(filename).toMatch(/\.jpg$/)
    })

    it('generates unique filenames', () => {
      const names = new Set(
        Array.from({ length: 10 }, () => generateImageFilename('image/png')),
      )
      // At least most should be unique (random part)
      expect(names.size).toBeGreaterThanOrEqual(9)
    })
  })

  describe('getAssetsDir', () => {
    it('converts .md to .assets', () => {
      expect(getAssetsDir('/path/to/article.md')).toBe('/path/to/article.assets')
    })

    it('handles case-insensitive .MD', () => {
      expect(getAssetsDir('/path/to/article.MD')).toBe('/path/to/article.assets')
    })
  })

  describe('buildImageLocalPath', () => {
    it('builds full local path', () => {
      expect(buildImageLocalPath('/docs/article.md', 'img.png')).toBe(
        '/docs/article.assets/img.png',
      )
    })
  })

  describe('buildMarkdownImageRef', () => {
    it('builds relative markdown reference', () => {
      const ref = buildMarkdownImageRef('/docs/article.md', 'img.png')
      expect(ref).toBe('./article.assets/img.png')
    })
  })
})
