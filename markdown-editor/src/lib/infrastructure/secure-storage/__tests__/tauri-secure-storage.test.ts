import { describe, it, expect, vi, beforeEach } from 'vitest'

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}))

const mockStore = {
  get: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}

const mockClient = {
  getStore: vi.fn().mockReturnValue(mockStore),
}

const mockPrimaryStronghold = {
  loadClient: vi.fn().mockResolvedValue(mockClient),
  createClient: vi.fn().mockResolvedValue(mockClient),
  save: vi.fn().mockResolvedValue(undefined),
}

const mockLegacyStronghold = {
  loadClient: vi.fn().mockResolvedValue(mockClient),
  createClient: vi.fn().mockResolvedValue(mockClient),
  save: vi.fn().mockResolvedValue(undefined),
}

const mockInvoke = vi.fn().mockResolvedValue({ password: 'derived-password' })
const mockStrongholdLoad = vi.fn().mockResolvedValue(mockPrimaryStronghold)

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: notifyMock,
}))

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn().mockResolvedValue('/app-data'),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}))

vi.mock('@tauri-apps/plugin-stronghold', () => ({
  Stronghold: {
    load: mockStrongholdLoad,
  },
}))

import { SecureStorageRecoveryError, TauriSecureStorage } from '../tauri-secure-storage'

describe('TauriSecureStorage', () => {
  let storage: TauriSecureStorage

  beforeEach(() => {
    storage = new TauriSecureStorage()
    vi.clearAllMocks()
    mockClient.getStore.mockReturnValue(mockStore)
    mockPrimaryStronghold.loadClient.mockResolvedValue(mockClient)
    mockPrimaryStronghold.createClient.mockResolvedValue(mockClient)
    mockStrongholdLoad.mockResolvedValue(mockPrimaryStronghold)
    mockInvoke.mockResolvedValue({ password: 'derived-password' })
  })

  it('loads stronghold with derived password and not fixed value', async () => {
    mockStore.get.mockResolvedValue(null)

    await storage.get('init-key')

    expect(mockInvoke).toHaveBeenCalledWith('get_or_create_vault_password')
    expect(mockStrongholdLoad).toHaveBeenCalledWith('/app-data/vault.v2.hold', 'derived-password')
    expect(mockStrongholdLoad).not.toHaveBeenCalledWith('/app-data/vault.v2.hold', 'markdown-editor-vault')
  })

  it('get returns decoded string value', async () => {
    const encoded = Array.from(new TextEncoder().encode('secret-token'))
    mockStore.get.mockResolvedValue(encoded)
    const result = await storage.get('api-key')
    expect(result).toBe('secret-token')
  })

  it('set encodes and stores value', async () => {
    await storage.set('api-key', 'my-secret')
    expect(mockStore.insert).toHaveBeenCalledOnce()
    expect(mockPrimaryStronghold.save).toHaveBeenCalledOnce()
  })

  it('migrates data from legacy vault when primary load fails', async () => {
    const migratedStore = {
      get: vi.fn(async (key: string) => {
        if (key === 'platform:zenn') {
          return Array.from(new TextEncoder().encode('legacy-token'))
        }
        return null
      }),
      insert: vi.fn(),
      remove: vi.fn(),
    }

    const legacyClient = {
      getStore: vi.fn(() => migratedStore),
    }

    const primaryClient = {
      getStore: vi.fn(() => migratedStore),
    }

    const migratedStronghold = {
      loadClient: vi.fn().mockResolvedValue(primaryClient),
      createClient: vi.fn().mockResolvedValue(primaryClient),
      save: vi.fn().mockResolvedValue(undefined),
    }

    mockLegacyStronghold.loadClient.mockResolvedValue(legacyClient)

    mockStrongholdLoad
      .mockRejectedValueOnce(new Error('new vault open failed'))
      .mockResolvedValueOnce(mockLegacyStronghold)
      .mockResolvedValueOnce(migratedStronghold)
      .mockResolvedValueOnce(migratedStronghold)

    await storage.get('platform:zenn')

    expect(mockStrongholdLoad).toHaveBeenNthCalledWith(1, '/app-data/vault.v2.hold', 'derived-password')
    expect(mockStrongholdLoad).toHaveBeenNthCalledWith(2, '/app-data/vault.hold', 'markdown-editor-vault')
    expect(migratedStore.insert).toHaveBeenCalledWith('platform:zenn', expect.any(Array))
    expect(migratedStronghold.save).toHaveBeenCalled()
    expect(notifyMock).toHaveBeenCalledWith('info', '認証情報ストレージを新方式へ移行しました。')
  })

  it('throws recovery error and notifies when both primary and legacy fail', async () => {
    mockStrongholdLoad
      .mockRejectedValueOnce(new Error('new vault failed'))
      .mockRejectedValueOnce(new Error('legacy vault failed'))

    await expect(storage.get('api-key')).rejects.toBeInstanceOf(SecureStorageRecoveryError)
    expect(notifyMock).toHaveBeenCalledWith('error', '認証情報ストレージを復旧できませんでした。再認証が必要です。')
  })
})
