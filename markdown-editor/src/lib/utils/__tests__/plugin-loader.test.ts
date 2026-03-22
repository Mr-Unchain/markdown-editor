import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPluginWithRetry } from '../plugin-loader'
import type { PluginInstance } from '$lib/types/plugin'

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: vi.fn(),
}))

const mockPlugin: PluginInstance = {
  manifest: {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'Test',
    type: 'editor-extension',
    entryPoint: './test.ts',
  },
}

describe('loadPluginWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正常にプラグインをロードする', async () => {
    const loader = vi.fn().mockResolvedValue(mockPlugin)
    const result = await loadPluginWithRetry(loader, 'Test', 0)

    expect(result).toEqual(mockPlugin)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('失敗後にリトライして成功する', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValueOnce(mockPlugin)

    const result = await loadPluginWithRetry(loader, 'Test', 1)

    expect(result).toEqual(mockPlugin)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('最大リトライ回数を超えるとnullを返す', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('always fail'))

    const result = await loadPluginWithRetry(loader, 'Test', 0)

    expect(result).toBeNull()
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
