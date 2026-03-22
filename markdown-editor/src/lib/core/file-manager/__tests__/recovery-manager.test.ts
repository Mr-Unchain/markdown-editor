import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RecoveryManager } from '../recovery-manager'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { Tab } from '$lib/types/workspace'
import { DEFAULT_CURSOR_STATE } from '$lib/types/workspace'

function createMockFs(overrides: Partial<FileSystemAdapter> = {}): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readBinaryFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeBinaryFile: vi.fn().mockResolvedValue(undefined),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    rename: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    removeDir: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getFileInfo: vi.fn().mockResolvedValue({ size: 0, isSymlink: false, lastModified: 0 }),
    readFilePartial: vi.fn().mockResolvedValue(new Uint8Array()),
    watch: vi.fn().mockResolvedValue(() => Promise.resolve()),
    openFolderDialog: vi.fn().mockResolvedValue(null),
    openFileDialog: vi.fn().mockResolvedValue(null),
    saveFileDialog: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

function createDirtyTab(filePath: string, content: string): Tab {
  return {
    filePath,
    displayName: filePath.split('/').pop() ?? '',
    content,
    isDirty: true,
    isActive: false,
    fileType: 'markdown',
    cursorState: { ...DEFAULT_CURSOR_STATE },
    isExternal: false,
  }
}

describe('RecoveryManager', () => {
  let fs: FileSystemAdapter
  let dirtyTabs: Tab[]
  let manager: RecoveryManager

  beforeEach(() => {
    vi.useFakeTimers()
    dirtyTabs = []
    fs = createMockFs()
    manager = new RecoveryManager(fs, () => dirtyTabs)
  })

  afterEach(() => {
    manager.stop()
    vi.useRealTimers()
  })

  describe('start/stop', () => {
    it('開始するとisRunningがtrueになる', () => {
      manager.start('/workspace')
      expect(manager.isRunning).toBe(true)
    })

    it('停止するとisRunningがfalseになる', () => {
      manager.start('/workspace')
      manager.stop()
      expect(manager.isRunning).toBe(false)
    })
  })

  describe('checkAndRecover', () => {
    it('リカバリディレクトリがなければ空配列を返す', async () => {
      const result = await manager.checkAndRecover('/workspace')
      expect(result).toEqual([])
    })

    it('リカバリファイルを正しく読み込む', async () => {
      const recoveryData = JSON.stringify({
        originalPath: '/workspace/file.md',
        content: '# Recovered',
        timestamp: 1234567890,
      })

      fs = createMockFs({
        exists: vi.fn().mockResolvedValue(true),
        readDir: vi.fn().mockResolvedValue([
          { name: '_workspace_file.md.recovery', path: '/workspace/.markdown-editor-recovery/_workspace_file.md.recovery', isDirectory: false },
        ]),
        readFile: vi.fn().mockResolvedValue(recoveryData),
      })
      manager = new RecoveryManager(fs, () => [])

      const result = await manager.checkAndRecover('/workspace')

      expect(result).toHaveLength(1)
      expect(result[0]!.originalPath).toBe('/workspace/file.md')
      expect(result[0]!.content).toBe('# Recovered')
    })

    it('不正なリカバリファイルを無視する', async () => {
      fs = createMockFs({
        exists: vi.fn().mockResolvedValue(true),
        readDir: vi.fn().mockResolvedValue([
          { name: 'corrupt.recovery', path: '/workspace/.markdown-editor-recovery/corrupt.recovery', isDirectory: false },
        ]),
        readFile: vi.fn().mockResolvedValue('{invalid json'),
      })
      manager = new RecoveryManager(fs, () => [])

      const result = await manager.checkAndRecover('/workspace')

      expect(result).toEqual([])
    })
  })

  describe('cleanup', () => {
    it('特定ファイルのリカバリを削除する', async () => {
      fs = createMockFs({
        exists: vi.fn().mockResolvedValue(true),
      })
      manager = new RecoveryManager(fs, () => [])

      await manager.cleanup('/workspace', '/workspace/file.md')

      expect(fs.remove).toHaveBeenCalled()
    })

    it('全リカバリファイルを削除する', async () => {
      fs = createMockFs({
        exists: vi.fn().mockResolvedValue(true),
      })
      manager = new RecoveryManager(fs, () => [])

      await manager.cleanup('/workspace')

      expect(fs.removeDir).toHaveBeenCalledWith(
        '/workspace/.markdown-editor-recovery',
        { recursive: true },
      )
    })
  })
})
