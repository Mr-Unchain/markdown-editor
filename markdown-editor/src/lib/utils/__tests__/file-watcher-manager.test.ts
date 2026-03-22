import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FileWatcherManager } from '../file-watcher-manager'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { WatchEvent } from '$lib/types/file-manager'

function createMockFs(): FileSystemAdapter {
  const unwatchFn = vi.fn().mockResolvedValue(undefined)
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
    watch: vi.fn().mockResolvedValue(unwatchFn),
    openFolderDialog: vi.fn(),
    openFileDialog: vi.fn(),
    saveFileDialog: vi.fn(),
  }
}

describe('FileWatcherManager', () => {
  let fs: FileSystemAdapter
  let onTreeChange: ReturnType<typeof vi.fn>
  let onTabChange: ReturnType<typeof vi.fn>
  let manager: FileWatcherManager

  beforeEach(() => {
    vi.useFakeTimers()
    fs = createMockFs()
    onTreeChange = vi.fn()
    onTabChange = vi.fn()
    manager = new FileWatcherManager(fs, onTreeChange, onTabChange)
  })

  afterEach(async () => {
    await manager.stopAll()
    vi.useRealTimers()
  })

  it('ワークスペース監視を開始する', async () => {
    await manager.startWorkspaceWatch('/workspace')

    expect(fs.watch).toHaveBeenCalledWith(
      '/workspace',
      expect.any(Function),
      expect.objectContaining({ recursive: true }),
    )
    expect(manager.isWorkspaceWatching).toBe(true)
  })

  it('タブファイル監視を追加する', async () => {
    await manager.watchTabFile('/workspace/file.md')

    expect(fs.watch).toHaveBeenCalledWith(
      '/workspace/file.md',
      expect.any(Function),
      expect.objectContaining({ recursive: false }),
    )
    expect(manager.watchedTabCount).toBe(1)
  })

  it('同じファイルの二重監視を防ぐ', async () => {
    await manager.watchTabFile('/workspace/file.md')
    await manager.watchTabFile('/workspace/file.md')

    expect(fs.watch).toHaveBeenCalledTimes(1)
    expect(manager.watchedTabCount).toBe(1)
  })

  it('タブファイル監視を解除する', async () => {
    await manager.watchTabFile('/workspace/file.md')
    expect(manager.watchedTabCount).toBe(1)

    await manager.unwatchTabFile('/workspace/file.md')
    expect(manager.watchedTabCount).toBe(0)
  })

  it('全監視を停止する', async () => {
    await manager.startWorkspaceWatch('/workspace')
    await manager.watchTabFile('/workspace/a.md')
    await manager.watchTabFile('/workspace/b.md')

    await manager.stopAll()

    expect(manager.isWorkspaceWatching).toBe(false)
    expect(manager.watchedTabCount).toBe(0)
  })

  it('ワークスペース変更イベントをデバウンスしてコールバックする', async () => {
    let capturedCallback: ((event: WatchEvent) => void) | null = null
    fs.watch = vi.fn().mockImplementation((_path, callback) => {
      capturedCallback = callback
      return Promise.resolve(vi.fn())
    })

    const manager2 = new FileWatcherManager(fs, onTreeChange, onTabChange)
    await manager2.startWorkspaceWatch('/workspace')

    expect(capturedCallback).not.toBeNull()
    capturedCallback!({ type: 'create', paths: ['/workspace/new.md'] })

    expect(onTreeChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)

    expect(onTreeChange).toHaveBeenCalledWith({ type: 'create', paths: ['/workspace/new.md'] })

    await manager2.stopAll()
  })
})
