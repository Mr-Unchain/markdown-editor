import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageManager } from '../image-manager'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { PlatformAdapter, LocalImageRef } from '$lib/types/platform'

function createMockFs(): FileSystemAdapter {
  return {
    exists: vi.fn().mockResolvedValue(true),
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeBinaryFile: vi.fn().mockResolvedValue(undefined),
    readDir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
  } as unknown as FileSystemAdapter
}

function createMockAdapter(): PlatformAdapter {
  return {
    platformId: 'zenn',
    platformName: 'Zenn',
    supportsDirectPublish: false,
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    publishDraft: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    publishArticle: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    updateArticle: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    uploadImage: vi.fn().mockResolvedValue({
      localPath: '/test.png',
      remoteUrl: '/images/test.png',
      success: true,
    }),
  }
}

function createMockFile(name: string, type: string, size: number): File {
  const content = new ArrayBuffer(size)
  return new File([content], name, { type })
}

describe('ImageManager', () => {
  let manager: ImageManager
  let mockFs: FileSystemAdapter

  beforeEach(() => {
    mockFs = createMockFs()
    manager = new ImageManager(mockFs)
  })

  describe('insertFromFile', () => {
    it('validates and saves valid image', async () => {
      const file = createMockFile('test.png', 'image/png', 1024)
      const result = await manager.insertFromFile(file, '/docs/article.md')

      expect(result.success).toBe(true)
      expect(result.localPath).toContain('article.assets/')
      expect(result.markdownRef).toContain('./article.assets/')
      expect(mockFs.writeBinaryFile).toHaveBeenCalled()
    })

    it('rejects invalid image type', async () => {
      const file = createMockFile('test.svg', 'image/svg+xml', 1024)
      const result = await manager.insertFromFile(file, '/docs/article.md')

      expect(result.success).toBe(false)
      expect(result.error).toContain('サポートされていない')
    })

    it('rejects image over 5MB', async () => {
      const file = createMockFile('big.png', 'image/png', 6 * 1024 * 1024)
      const result = await manager.insertFromFile(file, '/docs/article.md')

      expect(result.success).toBe(false)
      expect(result.error).toContain('大きすぎます')
    })

    it('creates assets directory if not exists', async () => {
      ;(mockFs.exists as ReturnType<typeof vi.fn>).mockResolvedValue(false)
      const file = createMockFile('test.png', 'image/png', 1024)
      await manager.insertFromFile(file, '/docs/article.md')

      expect(mockFs.mkdir).toHaveBeenCalled()
    })
  })

  describe('uploadForPlatform', () => {
    it('uploads all images', async () => {
      const adapter = createMockAdapter()
      const images: LocalImageRef[] = [
        { localPath: '/img/a.png', filename: 'a.png', mimeType: 'image/png', size: 1024 },
        { localPath: '/img/b.png', filename: 'b.png', mimeType: 'image/png', size: 2048 },
      ]

      const results = await manager.uploadForPlatform(images, adapter)

      expect(results).toHaveLength(2)
      expect(results.every((r) => r.success)).toBe(true)
      expect(adapter.uploadImage).toHaveBeenCalledTimes(2)
    })

    it('handles partial failures', async () => {
      const adapter = createMockAdapter()
      ;(adapter.uploadImage as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          localPath: '/a.png',
          remoteUrl: '/images/a.png',
          success: true,
        })
        .mockRejectedValueOnce(new Error('upload failed'))

      const images: LocalImageRef[] = [
        { localPath: '/a.png', filename: 'a.png', mimeType: 'image/png', size: 1024 },
        { localPath: '/b.png', filename: 'b.png', mimeType: 'image/png', size: 2048 },
      ]

      const results = await manager.uploadForPlatform(images, adapter)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toContain('upload failed')
    })

    it('calls progress callback', async () => {
      const adapter = createMockAdapter()
      const onProgress = vi.fn()
      const images: LocalImageRef[] = [
        { localPath: '/a.png', filename: 'a.png', mimeType: 'image/png', size: 1024 },
      ]

      await manager.uploadForPlatform(images, adapter, undefined, onProgress)

      expect(onProgress).toHaveBeenCalledWith(0, 1, '/a.png')
    })

    it('respects abort signal', async () => {
      const adapter = createMockAdapter()
      const controller = new AbortController()
      controller.abort()

      const images: LocalImageRef[] = [
        { localPath: '/a.png', filename: 'a.png', mimeType: 'image/png', size: 1024 },
      ]

      await expect(
        manager.uploadForPlatform(images, adapter, controller.signal),
      ).rejects.toThrow('キャンセル')
    })
  })

  describe('collectLocalImages', () => {
    it('returns images from assets directory', async () => {
      ;(mockFs.readDir as ReturnType<typeof vi.fn>).mockResolvedValue([
        { name: 'img1.png', path: '/docs/article.assets/img1.png', isDirectory: false },
        { name: 'img2.jpg', path: '/docs/article.assets/img2.jpg', isDirectory: false },
        { name: 'subfolder', path: '/docs/article.assets/subfolder', isDirectory: true },
        { name: 'readme.txt', path: '/docs/article.assets/readme.txt', isDirectory: false },
      ])

      const images = await manager.collectLocalImages('/docs/article.md')

      expect(images).toHaveLength(2)
      expect(images[0].mimeType).toBe('image/png')
      expect(images[1].mimeType).toBe('image/jpeg')
    })

    it('returns empty array when assets dir not exists', async () => {
      ;(mockFs.exists as ReturnType<typeof vi.fn>).mockResolvedValue(false)
      const images = await manager.collectLocalImages('/docs/noassets.md')
      expect(images).toEqual([])
    })
  })
})
