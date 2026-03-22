import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SessionState } from '$lib/types/workspace'
import { FileManager } from '$lib/core/file-manager/file-manager'
import { FileWatcherManager } from '$lib/utils/file-watcher-manager'
import { RecoveryManager } from '$lib/core/file-manager/recovery-manager'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import { atomicWriteSession, recoverSession } from '$lib/utils/atomic-write'
import {
  tabsState, setActiveTab, getActiveTab,
} from '$lib/stores/tabs.svelte'
import { fileTreeState, setNodeExpanded } from '$lib/stores/file-tree.svelte'
import { setAutoSaveMode } from '$lib/stores/save-status.svelte'

const SESSION_FILE = '.markdown-editor-session.json'

export class WorkspaceService {
  readonly fileManager: FileManager
  private fileWatcher: FileWatcherManager
  private recoveryManager: RecoveryManager
  private settings: SettingsManager
  private fs: FileSystemAdapter
  private workspacePath: string | null = null

  constructor(fs: FileSystemAdapter, settings: SettingsManager) {
    this.fs = fs
    this.settings = settings
    this.fileManager = new FileManager(fs)

    this.fileWatcher = new FileWatcherManager(
      fs,
      // Layer 1: ツリー変更ハンドラ
      (_event) => {
        // ファイルツリーの再読み込みをトリガー
        if (this.workspacePath) {
          this.fileManager.expandFolder(this.workspacePath).catch(() => {})
        }
      },
      // Layer 2: タブファイル変更ハンドラ
      (_filePath, _event) => {
        // 競合解決フローはUIコンポーネントで処理
      },
    )

    this.recoveryManager = new RecoveryManager(
      fs,
      () => this.fileManager.getDirtyTabs(),
    )
  }

  async initialize(): Promise<void> {
    const lastPath = this.settings.get('lastWorkspacePath')
    const autoSave = this.settings.get('editor').autoSave
    setAutoSaveMode(autoSave.mode)

    if (lastPath) {
      const exists = await this.fs.exists(lastPath)
      if (exists) {
        await this.openWorkspace(lastPath)
        await this.restoreSession()
      }
    }
  }

  async openWorkspace(path: string): Promise<void> {
    // 前のワークスペースをクリーンアップ
    if (this.workspacePath) {
      await this.closeWorkspace()
    }

    const result = await this.fileManager.openWorkspace(path)
    if (!result.ok) return

    this.workspacePath = path
    await this.settings.set('lastWorkspacePath', path)

    // 非同期でファイル監視とリカバリチェックを開始
    this.fileWatcher.startWorkspaceWatch(path).catch(() => {})

    const autoSave = this.settings.get('editor').autoSave
    if (autoSave.mode === 'manual') {
      this.recoveryManager.start(path)
    }

    // リカバリチェック
    const recoveryFiles = await this.recoveryManager.checkAndRecover(path)
    if (recoveryFiles.length > 0) {
      // RecoveryDialogで処理（UIコンポーネントにイベントを公開）
      // ストア経由で通知
    }
  }

  async closeWorkspace(): Promise<void> {
    await this.saveSession()
    await this.fileWatcher.stopAll()
    this.recoveryManager.stop()

    if (this.workspacePath) {
      await this.recoveryManager.cleanup(this.workspacePath)
    }

    this.fileManager.closeWorkspace()
    this.workspacePath = null
  }

  async saveSession(): Promise<void> {
    if (!this.workspacePath) return

    const activeTab = getActiveTab()
    const expandedFolders = this.collectExpandedFolders(fileTreeState.nodes)

    const session: SessionState = {
      workspacePath: this.workspacePath,
      openTabs: tabsState.tabs.map((t) => ({
        filePath: t.filePath,
        cursorPosition: t.cursorState.cursorPosition,
        scrollTop: t.cursorState.scrollTop,
      })),
      activeTabPath: activeTab?.filePath ?? null,
      expandedFolders,
    }

    const sessionPath = `${this.workspacePath}/${SESSION_FILE}`
    await atomicWriteSession(sessionPath, session, this.fs)
    await this.settings.set('session', session)
  }

  async restoreSession(): Promise<void> {
    if (!this.workspacePath) return

    const sessionPath = `${this.workspacePath}/${SESSION_FILE}`
    const result = await recoverSession(sessionPath, this.fs)

    if (!result.ok) {
      // セッションファイルがなければsettingsから復元を試行
      const savedSession = this.settings.get('session')
      if (savedSession && savedSession.workspacePath === this.workspacePath) {
        await this.applySession(savedSession)
      }
      return
    }

    await this.applySession(result.value)
  }

  async requestClose(): Promise<boolean> {
    const dirtyTabs = this.fileManager.getDirtyTabs()
    if (dirtyTabs.length === 0) {
      await this.saveSession()
      return true
    }

    // 未保存タブの処理はUIコンポーネント（確認ダイアログ）で対応
    // ここではsessionの保存のみ
    await this.saveSession()
    return dirtyTabs.length === 0
  }

  getWorkspacePath(): string | null {
    return this.workspacePath
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager
  }

  getFileWatcher(): FileWatcherManager {
    return this.fileWatcher
  }

  private async applySession(session: SessionState): Promise<void> {
    // Phase 2: タブ復元
    for (const sessionTab of session.openTabs) {
      const exists = await this.fs.exists(sessionTab.filePath)
      if (!exists) continue

      const result = await this.fileManager.openTab(sessionTab.filePath)
      if (result.ok) {
        result.value.cursorState.cursorPosition = sessionTab.cursorPosition
        result.value.cursorState.scrollTop = sessionTab.scrollTop
      }
    }

    // アクティブタブを設定
    if (session.activeTabPath) {
      setActiveTab(session.activeTabPath)
    }

    // 展開フォルダを復元
    for (const folderPath of session.expandedFolders) {
      await this.fileManager.expandFolder(folderPath)
    }
  }

  private collectExpandedFolders(nodes: import('$lib/types/workspace').FileTreeNode[]): string[] {
    const expanded: string[] = []
    for (const node of nodes) {
      if (node.isDirectory && node.isExpanded) {
        expanded.push(node.path)
        expanded.push(...this.collectExpandedFolders(node.children))
      }
    }
    return expanded
  }
}
