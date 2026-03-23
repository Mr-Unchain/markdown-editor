import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initPlatformStore,
  getConnections,
  hasCredentials,
  isConnected,
  loadConnections,
  updateConnectionStatus,
} from '../platform-store.svelte'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'

function createMockSettingsManager(
  platforms?: { connections: Array<{ platformId: string; displayName: string; isConfigured: boolean }> },
  credentials?: Record<string, string | null>,
): SettingsManager {
  return {
    get: vi.fn((key: string) => {
      if (key === 'platforms') return platforms ?? undefined
      return undefined
    }),
    getPlatformCredentials: vi.fn(async (id: string) => credentials?.[id] ?? null),
  } as unknown as SettingsManager
}

describe('platform-store', () => {
  describe('loadConnections', () => {
    it('creates default zenn connection when no config exists', async () => {
      const sm = createMockSettingsManager()
      initPlatformStore(sm)
      await loadConnections()

      const conns = getConnections()
      expect(conns).toHaveLength(1)
      expect(conns[0].platformId).toBe('zenn')
      expect(conns[0].connectionStatus).toBe('unknown')
    })

    it('loads connections from settings and checks credentials', async () => {
      const sm = createMockSettingsManager(
        {
          connections: [
            { platformId: 'zenn', displayName: 'Zenn', isConfigured: true },
          ],
        },
        { zenn: '{"type":"zenn"}' },
      )
      initPlatformStore(sm)
      await loadConnections()

      expect(hasCredentials('zenn')).toBe(true)
    })

    it('marks as not configured when no credentials', async () => {
      const sm = createMockSettingsManager(
        {
          connections: [
            { platformId: 'zenn', displayName: 'Zenn', isConfigured: true },
          ],
        },
        {},
      )
      initPlatformStore(sm)
      await loadConnections()

      expect(hasCredentials('zenn')).toBe(false)
    })
  })

  describe('updateConnectionStatus', () => {
    it('updates connection status', async () => {
      const sm = createMockSettingsManager()
      initPlatformStore(sm)
      await loadConnections()

      updateConnectionStatus('zenn', { success: true, message: 'OK' })
      expect(isConnected('zenn')).toBe(true)
    })

    it('marks as disconnected on failure', async () => {
      const sm = createMockSettingsManager()
      initPlatformStore(sm)
      await loadConnections()

      updateConnectionStatus('zenn', { success: false, message: 'Failed' })
      expect(isConnected('zenn')).toBe(false)
    })
  })
})
