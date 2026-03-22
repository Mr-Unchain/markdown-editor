import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SettingsManager } from '../settings-manager.svelte'
import { DEFAULT_SETTINGS } from '../defaults'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SecureStorage } from '$lib/infrastructure/secure-storage/types'

// Mock isTauri to return false (Web mode)
vi.mock('$lib/infrastructure/filesystem/factory', () => ({
  isTauri: vi.fn().mockReturnValue(false),
}))

function createMockFs(): FileSystemAdapter {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    readDir: vi.fn(),
    mkdir: vi.fn(),
    exists: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    removeDir: vi.fn(),
    copyFile: vi.fn(),
    getFileInfo: vi.fn(),
    readFilePartial: vi.fn(),
    watch: vi.fn(),
    openFolderDialog: vi.fn(),
    openFileDialog: vi.fn(),
    saveFileDialog: vi.fn(),
  }
}

function createMockSecureStorage(): SecureStorage {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => { store.set(key, value) }),
    remove: vi.fn(async (key: string) => { store.delete(key) }),
    has: vi.fn(async (key: string) => store.has(key)),
  }
}

describe('SettingsManager', () => {
  let manager: SettingsManager
  let mockFs: FileSystemAdapter
  let mockSecure: SecureStorage

  beforeEach(() => {
    localStorage.clear()
    manager = new SettingsManager()
    mockFs = createMockFs()
    mockSecure = createMockSecureStorage()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default settings', () => {
    const settings = manager.getAll()
    expect(settings.editor.fontSize).toBe(DEFAULT_SETTINGS.editor.fontSize)
  })

  it('loads settings from localStorage on init (web mode)', async () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      editor: { ...DEFAULT_SETTINGS.editor, fontSize: 20 },
    }
    localStorage.setItem('markdown-editor-settings', JSON.stringify(customSettings))

    await manager.initialize(mockFs, mockSecure)
    expect(manager.get('editor').fontSize).toBe(20)
  })

  it('get returns specific key', async () => {
    await manager.initialize(mockFs, mockSecure)
    expect(manager.get('lastWorkspacePath')).toBeNull()
  })

  it('set updates the value', async () => {
    await manager.initialize(mockFs, mockSecure)
    await manager.set('lastWorkspacePath', '/my/workspace')
    expect(manager.get('lastWorkspacePath')).toBe('/my/workspace')
  })

  it('setEditor updates nested editor settings', async () => {
    await manager.initialize(mockFs, mockSecure)
    await manager.setEditor('fontSize', 24)
    expect(manager.get('editor').fontSize).toBe(24)
  })

  it('flush saves immediately', async () => {
    await manager.initialize(mockFs, mockSecure)
    await manager.set('lastWorkspacePath', '/test')
    await manager.flush()

    const stored = localStorage.getItem('markdown-editor-settings')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.lastWorkspacePath).toBe('/test')
  })

  it('platform credentials use secure storage', async () => {
    await manager.initialize(mockFs, mockSecure)
    await manager.setPlatformCredentials('zenn', '{"token":"abc"}')
    expect(mockSecure.set).toHaveBeenCalledWith('platform:zenn', '{"token":"abc"}')

    const result = await manager.getPlatformCredentials('zenn')
    expect(result).toBe('{"token":"abc"}')
  })

  it('removePlatformCredentials delegates to secure storage', async () => {
    await manager.initialize(mockFs, mockSecure)
    await manager.removePlatformCredentials('zenn')
    expect(mockSecure.remove).toHaveBeenCalledWith('platform:zenn')
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('markdown-editor-settings', '{{invalid json')
    await manager.initialize(mockFs, mockSecure)
    // Should fall back to defaults
    expect(manager.get('editor').fontSize).toBe(DEFAULT_SETTINGS.editor.fontSize)
  })
})
