import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublishPipeline } from '../publish-pipeline'
import { ImageManager } from '$lib/core/image-manager/image-manager'
import { ExportService } from '$lib/integration/export/export-service'
import { PublishCancelledError, PublishError } from '$lib/types/platform'
import type { PlatformAdapter, ArticlePayload, PublishProgress } from '$lib/types/platform'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'

// Mock dependencies
vi.mock('$lib/integration/export/export-service', () => ({
  ExportService: vi.fn().mockImplementation(() => ({
    toMarkdown: vi.fn((content: string) => content),
  })),
}))

vi.mock('$lib/integration/export/frontmatter-utils', () => ({
  upsertPublishRecord: vi.fn(async (content: string) => content),
}))

function createMockFs(): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue('---\ntitle: Test\n---\nContent'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(true),
  } as unknown as FileSystemAdapter
}

function createMockAdapter(): PlatformAdapter {
  return {
    platformId: 'zenn',
    platformName: 'Zenn',
    supportsDirectPublish: false,
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    publishDraft: vi.fn().mockResolvedValue({
      success: true,
      platformId: 'zenn',
      articleId: 'test-slug',
      publishRecord: {
        platformId: 'zenn',
        articleId: 'test-slug',
        slug: 'test-slug',
        publishedAt: '2026-03-23T00:00:00Z',
        updatedAt: '2026-03-23T00:00:00Z',
        sha: 'sha123',
      },
    }),
    publishArticle: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    updateArticle: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    uploadImage: vi.fn().mockResolvedValue({
      localPath: '/test.png',
      remoteUrl: '/images/test.png',
      success: true,
    }),
  }
}

function createPayload(overrides?: Partial<ArticlePayload>): ArticlePayload {
  return {
    title: 'Test Article',
    body: '# Hello',
    bodyFormat: 'markdown',
    images: [],
    ...overrides,
  }
}

describe('PublishPipeline', () => {
  let pipeline: PublishPipeline
  let mockFs: FileSystemAdapter
  let mockAdapter: PlatformAdapter
  let progressUpdates: PublishProgress[]

  beforeEach(() => {
    mockFs = createMockFs()
    const imageManager = new ImageManager(mockFs)
    const exportService = new ExportService()
    pipeline = new PublishPipeline(imageManager, exportService, mockFs)
    mockAdapter = createMockAdapter()
    progressUpdates = []
  })

  const onProgress = (p: PublishProgress) => progressUpdates.push({ ...p })

  describe('execute', () => {
    it('completes all 7 steps successfully', async () => {
      const result = await pipeline.execute(createPayload(), mockAdapter, onProgress)

      expect(result.success).toBe(true)
      expect(progressUpdates.length).toBeGreaterThanOrEqual(7)
      expect(progressUpdates[progressUpdates.length - 1].status).toBe('completed')
    })

    it('publishes with adapter', async () => {
      await pipeline.execute(createPayload(), mockAdapter, onProgress)
      expect(mockAdapter.publishDraft).toHaveBeenCalled()
    })

    it('validates title is required', async () => {
      const payload = createPayload({ title: '' })
      await expect(
        pipeline.execute(payload, mockAdapter, onProgress),
      ).rejects.toThrow('タイトルは必須です')
    })

    it('validates body is required', async () => {
      const payload = createPayload({ body: '' })
      await expect(
        pipeline.execute(payload, mockAdapter, onProgress),
      ).rejects.toThrow('本文は必須です')
    })

    it('updates frontmatter when filePath provided', async () => {
      await pipeline.execute(createPayload(), mockAdapter, onProgress, '/test.md')
      expect(mockFs.writeFile).toHaveBeenCalled()
    })
  })

  describe('cancel', () => {
    it('aborts pipeline on cancel', async () => {
      // Create a slow adapter that we can cancel mid-flight
      const slowAdapter = {
        ...mockAdapter,
        publishDraft: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ success: true, platformId: 'zenn' }), 5000)),
        ),
      }

      const promise = pipeline.execute(createPayload(), slowAdapter, onProgress)
      pipeline.cancel()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('progress reporting', () => {
    it('reports progress for each step', async () => {
      await pipeline.execute(createPayload(), mockAdapter, onProgress)

      const steps = progressUpdates.map((p) => p.currentStep)
      expect(steps).toContain('validate')
      expect(steps).toContain('export')
      expect(steps).toContain('publish')
      expect(steps).toContain('complete')
    })

    it('sets status to failed on error', async () => {
      const failAdapter = {
        ...mockAdapter,
        publishDraft: vi.fn().mockRejectedValue(new Error('publish failed')),
      }

      await expect(
        pipeline.execute(createPayload(), failAdapter, onProgress),
      ).rejects.toThrow()

      const lastUpdate = progressUpdates[progressUpdates.length - 1]
      expect(lastUpdate.status).toBe('failed')
    })
  })
})
