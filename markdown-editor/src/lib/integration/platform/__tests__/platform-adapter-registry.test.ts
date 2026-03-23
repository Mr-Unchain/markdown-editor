import { describe, it, expect, beforeEach } from 'vitest'
import { PlatformAdapterRegistry } from '../platform-adapter-registry'
import type { PlatformAdapter } from '$lib/types/platform'

function createMockAdapter(id: string): PlatformAdapter {
  return {
    platformId: id,
    platformName: `Mock ${id}`,
    supportsDirectPublish: false,
    testConnection: async () => ({ success: true }),
    publishDraft: async () => ({ success: true, platformId: id }),
    publishArticle: async () => ({ success: true, platformId: id }),
    updateArticle: async () => ({ success: true, platformId: id }),
    uploadImage: async () => ({ localPath: '', remoteUrl: '', success: true }),
  }
}

describe('PlatformAdapterRegistry', () => {
  let registry: PlatformAdapterRegistry

  beforeEach(() => {
    registry = new PlatformAdapterRegistry()
  })

  it('registers and retrieves adapter', () => {
    const adapter = createMockAdapter('zenn')
    registry.register(adapter)

    expect(registry.get('zenn')).toBe(adapter)
    expect(registry.has('zenn')).toBe(true)
  })

  it('returns undefined for unregistered platform', () => {
    expect(registry.get('unknown')).toBeUndefined()
    expect(registry.has('unknown')).toBe(false)
  })

  it('returns all registered adapters', () => {
    registry.register(createMockAdapter('zenn'))
    registry.register(createMockAdapter('note'))

    expect(registry.getAll()).toHaveLength(2)
    expect(registry.getPlatformIds()).toEqual(['zenn', 'note'])
  })

  it('unregisters adapter', () => {
    registry.register(createMockAdapter('zenn'))
    registry.unregister('zenn')

    expect(registry.has('zenn')).toBe(false)
    expect(registry.getAll()).toHaveLength(0)
  })

  it('overwrites adapter with same platformId', () => {
    const adapter1 = createMockAdapter('zenn')
    const adapter2 = createMockAdapter('zenn')

    registry.register(adapter1)
    registry.register(adapter2)

    expect(registry.get('zenn')).toBe(adapter2)
    expect(registry.getAll()).toHaveLength(1)
  })
})
