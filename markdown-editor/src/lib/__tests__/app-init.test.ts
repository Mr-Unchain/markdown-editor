import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetAppContext, getAppContext } from '../app-init'

// Mock the factory to avoid real environment detection
vi.mock('$lib/infrastructure/filesystem/factory', () => ({
  isTauri: vi.fn().mockReturnValue(false),
  isFileSystemAccessSupported: vi.fn().mockReturnValue(true),
  createFileSystemAdapter: vi.fn().mockReturnValue({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    readDir: vi.fn(),
    mkdir: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
    rename: vi.fn(),
    remove: vi.fn(),
    removeDir: vi.fn(),
    copyFile: vi.fn(),
    getFileInfo: vi.fn(),
    readFilePartial: vi.fn(),
    watch: vi.fn().mockResolvedValue(vi.fn()),
    openFolderDialog: vi.fn(),
    openFileDialog: vi.fn(),
    saveFileDialog: vi.fn(),
  }),
}))

describe('app-init', () => {
  beforeEach(() => {
    resetAppContext()
    localStorage.clear()
  })

  it('getAppContext returns null before initialization', () => {
    expect(getAppContext()).toBeNull()
  })

  it('resetAppContext clears the context', async () => {
    const { initializeApp } = await import('../app-init')
    await initializeApp()
    expect(getAppContext()).not.toBeNull()

    resetAppContext()
    expect(getAppContext()).toBeNull()
  })

  it('initializeApp returns context with required services', async () => {
    const { initializeApp } = await import('../app-init')
    const context = await initializeApp()
    expect(context.fs).toBeDefined()
    expect(context.secureStorage).toBeDefined()
    expect(context.settingsManager).toBeDefined()
    expect(context.workspaceService).toBeDefined()
  })

  it('initializeApp returns same context on second call', async () => {
    const { initializeApp } = await import('../app-init')
    const first = await initializeApp()
    const second = await initializeApp()
    expect(first).toBe(second)
  })
})
