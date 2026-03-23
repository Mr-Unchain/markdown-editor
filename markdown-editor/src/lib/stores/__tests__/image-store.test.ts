import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initImageStore,
  getIsProcessing,
  getImageError,
  insertFromSlashCommand,
  clearImageError,
} from '../image-store.svelte'
import type { ImageManager } from '$lib/core/image-manager/image-manager'

function createMockImageManager(): ImageManager {
  return {
    insertFromFile: vi.fn().mockResolvedValue({
      success: true,
      localPath: '/test.assets/img.png',
      markdownRef: './test.assets/img.png',
    }),
    handleDrop: vi.fn().mockResolvedValue([{ success: true }]),
    handlePaste: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as ImageManager
}

describe('image-store', () => {
  beforeEach(() => {
    const manager = createMockImageManager()
    initImageStore(manager)
  })

  it('initializes with idle state', () => {
    expect(getIsProcessing()).toBe(false)
    expect(getImageError()).toBeNull()
  })

  describe('insertFromSlashCommand', () => {
    it('inserts image and returns result', async () => {
      const file = new File([new ArrayBuffer(1024)], 'test.png', { type: 'image/png' })
      const result = await insertFromSlashCommand(file, '/docs/article.md')

      expect(result.success).toBe(true)
      expect(result.localPath).toBeTruthy()
      expect(getIsProcessing()).toBe(false)
    })
  })

  describe('clearImageError', () => {
    it('clears error state', () => {
      clearImageError()
      expect(getImageError()).toBeNull()
    })
  })
})
