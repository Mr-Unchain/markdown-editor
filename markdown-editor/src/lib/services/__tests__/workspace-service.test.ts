import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkspaceService } from '../workspace-service'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'

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
    removeTab: vi.fn(),
    setActiveTab: vi.fn(),
    updateTabContent: vi.fn(),
    markTabSaved: vi.fn(),
    reorderTabs: vi.fn(),
    updateTabCursorState: vi.fn(),
    getActiveTab: vi.fn(() => null),
    getDirtyTabs: vi.fn(() => []),
  }
})

vi.mock('$lib/stores/save-status.svelte', () => ({
  setSaveStatus: vi.fn(),
  setAutoSaveMode: vi.fn(),
}))

vi.mock('$lib/stores/notifications.svelte', () => ({
  notify: vi.fn(),
}))

function createMockFs(overrides: Partial<FileSystemAdapter> = {}): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue(''),
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
    watch: vi.fn().mockResolvedValue(vi.fn()),
    openFolderDialog: vi.fn().mockResolvedValue(null),
    openFileDialog: vi.fn().mockResolvedValue(null),
    saveFileDialog: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

function createMockSettings(): SettingsManager {
  const store: Record<string, any> = {
    lastWorkspacePath: null,
    session: null,
    editor: { autoSave: { mode: 'manual', debounceMs: 1000 }, maxTabs: 20 },
  }
  return {
    get: vi.fn((key: string) => store[key]),
    set: vi.fn(async (key: string, value: any) => { store[key] = value }),
    getAll: vi.fn(() => store),
    current: store,
  } as unknown as SettingsManager
}

describe('WorkspaceService', () => {
  let fs: FileSystemAdapter
  let settings: ReturnType<typeof createMockSettings>
  let service: WorkspaceService

  beforeEach(() => {
    vi.clearAllMocks()
    fs = createMockFs()
    settings = createMockSettings()
    service = new WorkspaceService(fs, settings)
  })

  describe('initialize', () => {
    it('前回のワークスペースがなければ何もしない', async () => {
      await service.initialize()

      expect(service.getWorkspacePath()).toBeNull()
    })

    it('前回のワークスペースがあれば開く', async () => {
      ;(settings.get as any).mockImplementation((key: string) => {
        if (key === 'lastWorkspacePath') return '/workspace'
        if (key === 'editor') return { autoSave: { mode: 'manual', debounceMs: 1000 }, maxTabs: 20 }
        if (key === 'session') return null
        return null
      })

      await service.initialize()

      expect(service.getWorkspacePath()).toBe('/workspace')
    })
  })

  describe('openWorkspace', () => {
    it('ワークスペースを開く', async () => {
      await service.openWorkspace('/workspace')

      expect(service.getWorkspacePath()).toBe('/workspace')
      expect(settings.set).toHaveBeenCalledWith('lastWorkspacePath', '/workspace')
    })
  })

  describe('closeWorkspace', () => {
    it('ワークスペースを閉じてクリーンアップする', async () => {
      await service.openWorkspace('/workspace')
      await service.closeWorkspace()

      expect(service.getWorkspacePath()).toBeNull()
    })
  })

  describe('saveSession', () => {
    it('ワークスペースが開いていなければ何もしない', async () => {
      await service.saveSession()

      expect(fs.writeFile).not.toHaveBeenCalled()
    })

    it('セッションを保存する', async () => {
      await service.openWorkspace('/workspace')
      await service.saveSession()

      expect(settings.set).toHaveBeenCalledWith('session', expect.objectContaining({
        workspacePath: '/workspace',
      }))
    })
  })

  describe('requestClose', () => {
    it('未保存タブがなければtrueを返す', async () => {
      await service.openWorkspace('/workspace')
      const result = await service.requestClose()

      expect(result).toBe(true)
    })
  })

  describe('getRecoveryManager', () => {
    it('RecoveryManagerインスタンスを返す', () => {
      expect(service.getRecoveryManager()).toBeDefined()
    })
  })

  describe('getFileWatcher', () => {
    it('FileWatcherManagerインスタンスを返す', () => {
      expect(service.getFileWatcher()).toBeDefined()
    })
  })
})
