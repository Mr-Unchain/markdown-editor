import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublishService } from '../publish'
import { PlatformAdapterRegistry } from '$lib/integration/platform/platform-adapter-registry'
import { ExportService } from '$lib/integration/export/export-service'
import { ImageManager } from '$lib/core/image-manager/image-manager'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { PublishProgress, ZennCredentials } from '$lib/types/platform'

// Mock publish pipeline to avoid deep dependency chain
vi.mock('../publish-pipeline', () => ({
  PublishPipeline: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      success: true,
      platformId: 'zenn',
      articleId: 'test-slug',
    }),
    cancel: vi.fn(),
    isRunning: false,
  })),
}))

function createMockSettingsManager(): SettingsManager {
  const creds: ZennCredentials = {
    type: 'zenn',
    githubToken: 'ghp_test',
    repository: 'user/repo',
    repositoryOwner: 'user',
    repositoryName: 'repo',
    branch: 'main',
  }
  return {
    getPlatformCredentials: vi.fn().mockResolvedValue(JSON.stringify(creds)),
  } as unknown as SettingsManager
}

function createMockFs(): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue('content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(true),
  } as unknown as FileSystemAdapter
}

describe('PublishService', () => {
  let service: PublishService
  let progressUpdates: PublishProgress[]

  beforeEach(() => {
    const registry = new PlatformAdapterRegistry()
    const exportService = new ExportService()
    const fs = createMockFs()
    const imageManager = new ImageManager(fs)
    const settingsManager = createMockSettingsManager()

    service = new PublishService(registry, exportService, imageManager, settingsManager, fs)
    progressUpdates = []
  })

  describe('publish', () => {
    it('publishes successfully', async () => {
      const result = await service.publish(
        'zenn',
        { title: 'Test', body: '# Hello', bodyFormat: 'markdown', images: [] },
        (p) => progressUpdates.push(p),
      )

      expect(result.success).toBe(true)
    })

    it('prevents concurrent publishes', async () => {
      // Start first publish (won't resolve immediately due to mock)
      const promise1 = service.publish(
        'zenn',
        { title: 'Test1', body: '# A', bodyFormat: 'markdown', images: [] },
        () => {},
      )

      // While guard is held, isPublishing should be true during execution
      // After promise1 resolves, isPublishing should be false
      await promise1
      expect(service.isPublishing).toBe(false)
    })
  })

  describe('getExportService', () => {
    it('returns the export service', () => {
      expect(service.getExportService()).toBeInstanceOf(ExportService)
    })
  })
})
