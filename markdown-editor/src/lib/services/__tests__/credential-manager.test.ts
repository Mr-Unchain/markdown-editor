import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CredentialManager } from '../credential-manager'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import type { ZennCredentials } from '$lib/types/settings'

function createMockSettingsManager(credentials: Record<string, string | null> = {}) {
  return {
    getPlatformCredentials: vi.fn(async (id: string) => credentials[id] ?? null),
  } as unknown as SettingsManager
}

describe('CredentialManager', () => {
  let manager: CredentialManager

  describe('withCredentials', () => {
    it('provides parsed credentials to callback', async () => {
      const creds: ZennCredentials = {
        type: 'zenn',
        githubToken: 'ghp_test',
        repository: 'user/repo',
        repositoryOwner: 'user',
        repositoryName: 'repo',
        branch: 'main',
      }
      const sm = createMockSettingsManager({ zenn: JSON.stringify(creds) })
      manager = new CredentialManager(sm)

      const result = await manager.withCredentials('zenn', async (c) => {
        const zc = c as ZennCredentials
        return zc.githubToken
      })

      expect(result).toBe('ghp_test')
    })

    it('throws if no credentials configured', async () => {
      const sm = createMockSettingsManager({})
      manager = new CredentialManager(sm)

      await expect(
        manager.withCredentials('zenn', async () => 'noop'),
      ).rejects.toThrow('認証情報が設定されていません')
    })

    it('throws if credentials JSON is invalid', async () => {
      const sm = createMockSettingsManager({ zenn: 'not-json' })
      manager = new CredentialManager(sm)

      await expect(
        manager.withCredentials('zenn', async () => 'noop'),
      ).rejects.toThrow('認証情報の解析に失敗しました')
    })

    it('propagates callback errors', async () => {
      const creds: ZennCredentials = {
        type: 'zenn',
        githubToken: 'ghp_test',
        repository: 'user/repo',
        repositoryOwner: 'user',
        repositoryName: 'repo',
        branch: 'main',
      }
      const sm = createMockSettingsManager({ zenn: JSON.stringify(creds) })
      manager = new CredentialManager(sm)

      await expect(
        manager.withCredentials('zenn', async () => {
          throw new Error('callback error')
        }),
      ).rejects.toThrow('callback error')
    })
  })

  describe('hasCredentials', () => {
    it('returns true when credentials exist', async () => {
      const sm = createMockSettingsManager({ zenn: '{}' })
      manager = new CredentialManager(sm)
      expect(await manager.hasCredentials('zenn')).toBe(true)
    })

    it('returns false when no credentials', async () => {
      const sm = createMockSettingsManager({})
      manager = new CredentialManager(sm)
      expect(await manager.hasCredentials('zenn')).toBe(false)
    })
  })
})
