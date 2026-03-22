import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileManager } from '../file-manager'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { DirEntry } from '$lib/types/filesystem'

// Mock stores
vi.mock('$lib/stores/workspace.svelte', () => ({
  setWorkspace: vi.fn(),
  setWorkspaceLoading: vi.fn(),
  addRecentWorkspace: vi.fn(),
  resetWorkspaceState: vi.fn(),
}))

vi.mock('$lib/stores/file-tree.svelte', () => ({
  fileTreeState: { nodes: [], filter: { showHiddenFiles: false, extensionFilter: [], isFilterActive: false }, selectedPath: null },
  setFileTreeNodes: vi.fn(),
  setNodeChildren: vi.fn(),
  setNodeExpanded: vi.fn(),
  addNodeToTree: vi.fn(),
  removeNodeFromTree: vi.fn(),
  renameNodeInTree: vi.fn(),
}))

vi.mock('$lib/stores/tabs.svelte', () => {
  const tabs: any[] = []
  return {
    tabsState: { tabs },
    addTab: vi.fn((tab: any) => tabs.push(tab)),
    removeTab: vi.fn((path: string) => {
      const idx = tabs.findIndex((t: any) => t.filePath === path)
      if (idx !== -1) tabs.splice(idx, 1)
    }),
    setActiveTab: vi.fn(),
    updateTabContent: vi.fn(),
    markTabSaved: vi.fn(),
    reorderTabs: vi.fn(),
    updateTabCursorState: vi.fn(),
    getActiveTab: vi.fn(() => tabs.find((t: any) => t.isActive) ?? null),
    getDirtyTabs: vi.fn(() => tabs.filter((t: any) => t.isDirty)),
  }
})

vi.mock('$lib/stores/save-status.svelte', () => ({
  setSaveStatus: vi.fn(),
}))

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: vi.fn(),
}))

function createMockFs(overrides: Partial<FileSystemAdapter> = {}): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue('# Hello'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readBinaryFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeBinaryFile: vi.fn().mockResolvedValue(undefined),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(true),
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

describe('FileManager', () => {
  let fm: FileManager
  let mockFs: FileSystemAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    mockFs = createMockFs({
      readDir: vi.fn().mockResolvedValue([
        { name: 'src', path: '/workspace/src', isDirectory: true },
        { name: 'README.md', path: '/workspace/README.md', isDirectory: false },
      ] as DirEntry[]),
    })
    fm = new FileManager(mockFs)
  })

  describe('openWorkspace', () => {
    it('ワークスペースを正常にオープンする', async () => {
      const result = await fm.openWorkspace('/workspace')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.rootPath).toBe('/workspace')
        expect(result.value.name).toBe('workspace')
        expect(result.value.isOpen).toBe(true)
      }
      expect(mockFs.readDir).toHaveBeenCalledWith('/workspace')
    })

    it('存在しないパスでエラーを返す', async () => {
      mockFs.exists = vi.fn().mockResolvedValue(false)
      const result = await fm.openWorkspace('/nonexistent')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('createFile', () => {
    it('新規ファイルを作成する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(false)

      const result = await fm.createFile('/workspace', 'new-file.md')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.name).toBe('new-file.md')
        expect(result.value.path).toBe('/workspace/new-file.md')
      }
      expect(mockFs.writeFile).toHaveBeenCalledWith('/workspace/new-file.md', '')
    })

    it('不正なファイル名を拒否する', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.createFile('/workspace', 'file<name>.md')

      expect(result.ok).toBe(false)
    })

    it('既存ファイルと同名なら拒否する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(true)

      const result = await fm.createFile('/workspace', 'existing.md')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS')
      }
    })
  })

  describe('createFolder', () => {
    it('新規フォルダを作成する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(false)

      const result = await fm.createFolder('/workspace', 'new-folder')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.isDirectory).toBe(true)
      }
      expect(mockFs.mkdir).toHaveBeenCalledWith('/workspace/new-folder')
    })
  })

  describe('saveFile', () => {
    it('ファイルを保存してステータスを更新する', async () => {
      await fm.openWorkspace('/workspace')
      const { setSaveStatus } = await import('$lib/stores/save-status.svelte')
      const { markTabSaved } = await import('$lib/stores/tabs.svelte')

      const result = await fm.saveFile('/workspace/README.md', '# Updated')

      expect(result.ok).toBe(true)
      expect(mockFs.writeFile).toHaveBeenCalledWith('/workspace/README.md', '# Updated')
      expect(setSaveStatus).toHaveBeenCalledWith('saving')
      expect(setSaveStatus).toHaveBeenCalledWith('saved')
      expect(markTabSaved).toHaveBeenCalledWith('/workspace/README.md')
    })

    it('保存エラー時にerrorステータスを設定する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.writeFile = vi.fn().mockRejectedValue(new Error('disk full'))
      const { setSaveStatus } = await import('$lib/stores/save-status.svelte')

      const result = await fm.saveFile('/workspace/README.md', '# Error')

      expect(result.ok).toBe(false)
      expect(setSaveStatus).toHaveBeenCalledWith('error')
    })
  })

  describe('renameFile', () => {
    it('ファイル名を変更する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(false)

      const result = await fm.renameFile('/workspace/README.md', 'CHANGELOG.md')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('/workspace/CHANGELOG.md')
      }
      expect(mockFs.rename).toHaveBeenCalledWith('/workspace/README.md', '/workspace/CHANGELOG.md')
    })

    it('同名ファイルが存在する場合はエラー', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(true)

      const result = await fm.renameFile('/workspace/README.md', 'existing.md')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS')
      }
    })
  })

  describe('deleteFile', () => {
    it('ファイルを削除する', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.deleteFile('/workspace/README.md')

      expect(result.ok).toBe(true)
      expect(mockFs.remove).toHaveBeenCalledWith('/workspace/README.md')
    })

    it('ワークスペース外のパスを拒否する', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.deleteFile('/other/file.md')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })
  })

  describe('openTab', () => {
    it('ファイルをタブで開く', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.openTab('/workspace/README.md')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.filePath).toBe('/workspace/README.md')
        expect(result.value.content).toBe('# Hello')
        expect(result.value.isDirty).toBe(false)
        expect(result.value.fileType).toBe('markdown')
      }
    })

    it('ワークスペース外のファイルを拒否する', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.openTab('/other/file.md')

      expect(result.ok).toBe(false)
    })
  })

  describe('closeTab', () => {
    it('タブを閉じる', async () => {
      await fm.openWorkspace('/workspace')
      await fm.openTab('/workspace/README.md')

      fm.closeTab('/workspace/README.md')

      const { removeTab } = await import('$lib/stores/tabs.svelte')
      expect(removeTab).toHaveBeenCalledWith('/workspace/README.md')
    })
  })

  describe('expandFolder', () => {
    it('フォルダを展開してchildrenを設定する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.readDir = vi.fn().mockResolvedValue([
        { name: 'index.ts', path: '/workspace/src/index.ts', isDirectory: false },
      ])

      const result = await fm.expandFolder('/workspace/src')

      expect(result.ok).toBe(true)
    })

    it('ワークスペース外のフォルダ展開を拒否する', async () => {
      await fm.openWorkspace('/workspace')

      const result = await fm.expandFolder('/other/src')

      expect(result.ok).toBe(false)
    })
  })

  describe('markDirty', () => {
    it('タブをdirtyにしてステータスを更新する', async () => {
      await fm.openWorkspace('/workspace')
      await fm.openTab('/workspace/README.md')

      fm.markDirty('/workspace/README.md')

      const { setSaveStatus } = await import('$lib/stores/save-status.svelte')
      expect(setSaveStatus).toHaveBeenCalledWith('unsaved')
    })
  })

  describe('copyFile', () => {
    it('ファイルをコピーする', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.readDir = vi.fn().mockResolvedValue([])

      const result = await fm.copyFile('/workspace/README.md', '/workspace/src')

      expect(result.ok).toBe(true)
      expect(mockFs.copyFile).toHaveBeenCalled()
    })
  })

  describe('moveFile', () => {
    it('ファイルを移動する', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(false)

      const result = await fm.moveFile('/workspace/README.md', '/workspace/src')

      expect(result.ok).toBe(true)
      expect(mockFs.rename).toHaveBeenCalled()
    })

    it('移動先に同名ファイルがあればエラー', async () => {
      await fm.openWorkspace('/workspace')
      mockFs.exists = vi.fn().mockResolvedValue(true)

      const result = await fm.moveFile('/workspace/README.md', '/workspace/src')

      expect(result.ok).toBe(false)
    })
  })
})
