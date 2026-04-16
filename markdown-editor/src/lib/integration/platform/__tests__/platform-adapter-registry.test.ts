import { describe, it, expect, beforeEach } from 'vitest'
import { PlatformAdapterRegistry } from '../platform-adapter-registry'
import type { PlatformAdapter, PlatformAdapterFactory } from '$lib/types/platform'

function createMockAdapter(id: string): PlatformAdapter {
  return {
    platformId: id,
    platformName: `Mock ${id}`,
    supportsDirectPublish: false,
    capabilities: ['publish', 'update'],
    testConnection: async () => ({ success: true }),
    publishDraft: async () => ({ success: true, platformId: id }),
    publishArticle: async () => ({ success: true, platformId: id }),
    updateArticle: async () => ({ success: true, platformId: id }),
    uploadImage: async () => ({ localPath: '', remoteUrl: '', success: true }),
  }
}

function createMockFactory(id: string): PlatformAdapterFactory {
  return {
    platformId: id,
    platformName: `Mock ${id}`,
    capabilities: ['publish', 'update'],
    create: () => createMockAdapter(id),
  }
}

describe('PlatformAdapterRegistry', () => {
  let registry: PlatformAdapterRegistry

  beforeEach(() => {
    registry = new PlatformAdapterRegistry()
  })

  it('registers and retrieves adapter', () => {
    registry.register(createMockFactory('zenn'))

    const adapter = registry.get('zenn')?.create({})
    expect(adapter?.platformId).toBe('zenn')
    expect(registry.has('zenn')).toBe(true)
  })

  it('returns undefined for unregistered platform', () => {
    expect(registry.get('unknown')).toBeUndefined()
    expect(registry.has('unknown')).toBe(false)
  })

  it('returns all registered adapters', () => {
    registry.register(createMockFactory('zenn'))
    registry.register(createMockFactory('note'))

    expect(registry.getAll()).toHaveLength(2)
    expect(registry.getPlatformIds()).toEqual(['zenn', 'note'])
  })

  it('unregisters adapter', () => {
    registry.register(createMockFactory('zenn'))
    registry.unregister('zenn')

    expect(registry.has('zenn')).toBe(false)
    expect(registry.getAll()).toHaveLength(0)
  })

  it('overwrites adapter with same platformId', () => {
    const adapter1 = createMockFactory('zenn')
    const adapter2 = createMockFactory('zenn')

    registry.register(adapter1)
    registry.register(adapter2)

    expect(registry.get('zenn')).toBe(adapter2)
    expect(registry.getAll()).toHaveLength(1)
  })

  it('stores and exposes platform capabilities', () => {
    registry.register({
      platformId: 'note',
      platformName: 'note',
      capabilities: ['export-only'],
      create: () => createMockAdapter('note'),
    })

    expect(registry.get('note')?.capabilities).toEqual(['export-only'])
  })
})
