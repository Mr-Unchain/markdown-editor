import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStore = {
  get: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}

const mockClient = {
  getStore: vi.fn().mockReturnValue(mockStore),
}

const mockStronghold = {
  loadClient: vi.fn().mockResolvedValue(mockClient),
  createClient: vi.fn().mockResolvedValue(mockClient),
  save: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn().mockResolvedValue('/app-data'),
}))

vi.mock('@tauri-apps/plugin-stronghold', () => ({
  Stronghold: {
    load: vi.fn().mockResolvedValue(mockStronghold),
  },
}))

import { TauriSecureStorage } from '../tauri-secure-storage'

describe('TauriSecureStorage', () => {
  let storage: TauriSecureStorage

  beforeEach(() => {
    storage = new TauriSecureStorage()
    vi.clearAllMocks()
    mockClient.getStore.mockReturnValue(mockStore)
    mockStronghold.loadClient.mockResolvedValue(mockClient)
  })

  it('get returns decoded string value', async () => {
    const encoded = Array.from(new TextEncoder().encode('secret-token'))
    mockStore.get.mockResolvedValue(encoded)
    const result = await storage.get('api-key')
    expect(result).toBe('secret-token')
  })

  it('get returns null when key not found', async () => {
    mockStore.get.mockResolvedValue(null)
    const result = await storage.get('missing-key')
    expect(result).toBeNull()
  })

  it('set encodes and stores value', async () => {
    await storage.set('api-key', 'my-secret')
    expect(mockStore.insert).toHaveBeenCalledOnce()
    expect(mockStronghold.save).toHaveBeenCalledOnce()
  })

  it('remove deletes key and saves', async () => {
    // First initialize by calling get
    mockStore.get.mockResolvedValue(null)
    await storage.get('init')

    await storage.remove('api-key')
    expect(mockStore.remove).toHaveBeenCalledWith('api-key')
  })

  it('has returns true when key exists', async () => {
    const encoded = Array.from(new TextEncoder().encode('value'))
    mockStore.get.mockResolvedValue(encoded)
    const result = await storage.has('api-key')
    expect(result).toBe(true)
  })

  it('has returns false when key does not exist', async () => {
    mockStore.get.mockResolvedValue(null)
    const result = await storage.has('missing')
    expect(result).toBe(false)
  })

  it('creates client when loadClient fails', async () => {
    mockStronghold.loadClient.mockRejectedValue(new Error('not found'))
    mockStronghold.createClient.mockResolvedValue(mockClient)

    const encoded = Array.from(new TextEncoder().encode('value'))
    mockStore.get.mockResolvedValue(encoded)

    const result = await storage.get('key')
    expect(result).toBe('value')
    expect(mockStronghold.createClient).toHaveBeenCalledWith('credentials')
  })
})
