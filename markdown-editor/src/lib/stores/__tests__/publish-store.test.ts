import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initPublishStore,
  getPublishProgress,
  isPublishing,
  resetPublishState,
} from '../publish-store.svelte'
import type { PublishService } from '$lib/services/publish'

function createMockPublishService(): PublishService {
  return {
    publish: vi.fn().mockResolvedValue({ success: true, platformId: 'zenn' }),
    cancel: vi.fn(),
    isPublishing: false,
    getExportService: vi.fn(),
  } as unknown as PublishService
}

describe('publish-store', () => {
  beforeEach(() => {
    resetPublishState()
  })

  it('initializes with idle state', () => {
    const progress = getPublishProgress()
    expect(progress.status).toBe('idle')
    expect(progress.completedSteps).toBe(0)
    expect(progress.totalSteps).toBe(7)
  })

  it('isPublishing returns false initially', () => {
    expect(isPublishing()).toBe(false)
  })

  it('initPublishStore sets service', () => {
    const service = createMockPublishService()
    expect(() => initPublishStore(service)).not.toThrow()
  })

  it('resetPublishState clears state', () => {
    resetPublishState()
    expect(getPublishProgress().status).toBe('idle')
  })
})
