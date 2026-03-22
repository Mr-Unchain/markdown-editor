import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { FileTreeNode, Workspace, Tab, FileFilter } from '$lib/types/workspace'
import { DEFAULT_CURSOR_STATE } from '$lib/types/workspace'
import type { ValidationResult } from '$lib/types/file-manager'
import { type Result, ok, err, FileSystemError } from '$lib/types/filesystem'
import { PathValidator } from '$lib/utils/path-validator'
import { validateFileName, generateUniqueName, getFileType, containsNullByte } from '$lib/utils/file-name-validator'
import { FileTreeLoader, applyFilter, sortNodes } from './file-tree-loader'
import {
  setWorkspace, setWorkspaceLoading, addRecentWorkspace, resetWorkspaceState,
} from '$lib/stores/workspace.svelte'
import {
  setFileTreeNodes, setNodeChildren, setNodeExpanded,
  addNodeToTree, removeNodeFromTree, renameNodeInTree, fileTreeState,
} from '$lib/stores/file-tree.svelte'
import {
  tabsState, addTab, removeTab, setActiveTab,
  updateTabContent, markTabSaved, reorderTabs as reorderTabsInStore,
  updateTabCursorState, getActiveTab, getDirtyTabs,
} from '$lib/stores/tabs.svelte'
import { setSaveStatus } from '$lib/stores/save-status.svelte'
import { notify } from '$lib/stores/notifications.svelte'

export class FileManager {
  private fileTreeLoader: FileTreeLoader
  private pathValidator: PathValidator
  private workspaceRoot: string = ''

  constructor(private fs: FileSystemAdapter) {
    this.fileTreeLoader = new FileTreeLoader(fs)
    this.pathValidator = new PathValidator('')
  }

  // --- ワークスペース ---

  async openWorkspace(path: string): Promise<Result<Workspace>> {
    setWorkspaceLoading(true)
    try {
      const exists = await this.fs.exists(path)
      if (!exists) {
        return err(new FileSystemError('NOT_FOUND', 'ディレクトリが見つかりません', path))
      }

      this.workspaceRoot = path
      this.pathValidator.updateRoot(path)

      const nodes = await this.fileTreeLoader.loadRootEntries(path)
      setFileTreeNodes(nodes)

      const name = path.split('/').pop() ?? path.split('\\').pop() ?? path
      const workspace: Workspace = {
        rootPath: path,
        name,
        fileTree: nodes,
        isOpen: true,
      }
      setWorkspace(workspace)

      addRecentWorkspace({
        path,
        name,
        lastAccessedAt: new Date().toISOString(),
      })

      return ok(workspace)
    } catch (error) {
      return err(new FileSystemError(
        'IO_ERROR',
        `ワークスペースの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        path,
      ))
    } finally {
      setWorkspaceLoading(false)
    }
  }

  closeWorkspace(): void {
    resetWorkspaceState()
    setFileTreeNodes([])
    this.workspaceRoot = ''
  }

  // --- ファイルツリー ---

  async expandFolder(path: string): Promise<Result<FileTreeNode[]>> {
    const validation = this.pathValidator.validatePath(path)
    if (!validation.ok) return validation as Result<FileTreeNode[]>

    try {
      const children = await this.fileTreeLoader.loadChildren(path)
      setNodeChildren(path, children)
      setNodeExpanded(path, true)
      return ok(children)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', 'フォルダの展開に失敗しました', path))
    }
  }

  collapseFolder(path: string): void {
    setNodeExpanded(path, false)
  }

  getFilteredNodes(filter: FileFilter): FileTreeNode[] {
    return applyFilter(fileTreeState.nodes, filter)
  }

  // --- ファイルCRUD ---

  async createFile(parentPath: string, name: string): Promise<Result<FileTreeNode>> {
    const validation = this.validateFileOperation(name, parentPath)
    if (!validation.isValid) {
      return err(new FileSystemError('PERMISSION_DENIED', validation.message ?? 'バリデーションエラー', parentPath))
    }

    const fullPath = `${parentPath}/${name}`
    const pathValidation = this.pathValidator.validatePath(fullPath)
    if (!pathValidation.ok) return pathValidation as Result<FileTreeNode>

    try {
      if (await this.fs.exists(fullPath)) {
        return err(new FileSystemError('ALREADY_EXISTS', '同名のファイルが既に存在します', fullPath))
      }

      await this.fs.writeFile(fullPath, '')

      const node: FileTreeNode = {
        name,
        path: fullPath,
        isDirectory: false,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      }

      addNodeToTree(parentPath, node)
      return ok(node)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', 'ファイルの作成に失敗しました', fullPath))
    }
  }

  async createFolder(parentPath: string, name: string): Promise<Result<FileTreeNode>> {
    const validation = this.validateFileOperation(name, parentPath)
    if (!validation.isValid) {
      return err(new FileSystemError('PERMISSION_DENIED', validation.message ?? 'バリデーションエラー', parentPath))
    }

    const fullPath = `${parentPath}/${name}`
    const pathValidation = this.pathValidator.validatePath(fullPath)
    if (!pathValidation.ok) return pathValidation as Result<FileTreeNode>

    try {
      if (await this.fs.exists(fullPath)) {
        return err(new FileSystemError('ALREADY_EXISTS', '同名のフォルダが既に存在します', fullPath))
      }

      await this.fs.mkdir(fullPath)

      const node: FileTreeNode = {
        name,
        path: fullPath,
        isDirectory: true,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      }

      addNodeToTree(parentPath, node)
      return ok(node)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', 'フォルダの作成に失敗しました', fullPath))
    }
  }

  async saveFile(path: string, content: string): Promise<Result<void>> {
    const pathValidation = this.pathValidator.validatePath(path)
    if (!pathValidation.ok) return pathValidation as Result<void>

    try {
      setSaveStatus('saving')
      await this.fs.writeFile(path, content)
      markTabSaved(path)
      setSaveStatus('saved')
      return ok(undefined)
    } catch (error) {
      setSaveStatus('error')
      notify('error', `保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
      return err(new FileSystemError('IO_ERROR', 'ファイルの保存に失敗しました', path))
    }
  }

  async renameFile(oldPath: string, newName: string): Promise<Result<string>> {
    const validation = validateFileName(newName, oldPath)
    if (!validation.isValid) {
      return err(new FileSystemError('PERMISSION_DENIED', validation.message ?? 'バリデーションエラー', oldPath))
    }

    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'))
    const newPath = `${parentPath}/${newName}`

    const pathValidation = this.pathValidator.validatePath(newPath)
    if (!pathValidation.ok) return pathValidation as Result<string>

    try {
      if (await this.fs.exists(newPath)) {
        return err(new FileSystemError('ALREADY_EXISTS', '同名のファイルが既に存在します', newPath))
      }

      await this.fs.rename(oldPath, newPath)
      renameNodeInTree(oldPath, newPath, newName)

      // タブのパスも更新
      const tab = tabsState.tabs.find((t) => t.filePath === oldPath)
      if (tab) {
        tab.filePath = newPath
        tab.displayName = newName
        tab.fileType = getFileType(newName)
      }

      return ok(newPath)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', '名前の変更に失敗しました', oldPath))
    }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    const pathValidation = this.pathValidator.validatePath(path)
    if (!pathValidation.ok) return pathValidation as Result<void>

    try {
      await this.fs.remove(path)
      removeNodeFromTree(path)

      // フォルダの場合、配下のファイルのタブも先に閉じる
      const childTabs = tabsState.tabs.filter((t) => t.filePath.startsWith(path + '/'))
      for (const childTab of childTabs) {
        removeTab(childTab.filePath)
      }

      // 対象ファイル自体のタブを閉じる
      const tab = tabsState.tabs.find((t) => t.filePath === path)
      if (tab) {
        removeTab(path)
      }

      // 全タブ削除後にアクティブタブを設定
      if (tab || childTabs.length > 0) {
        this.activateAdjacentTab(path)
      }

      return ok(undefined)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', '削除に失敗しました', path))
    }
  }

  async copyFile(src: string, destDir: string): Promise<Result<string>> {
    const srcValidation = this.pathValidator.validatePath(src)
    if (!srcValidation.ok) return srcValidation as Result<string>

    const destValidation = this.pathValidator.validatePath(destDir)
    if (!destValidation.ok) return destValidation as Result<string>

    try {
      const fileName = src.split('/').pop() ?? ''
      const existingNames = await this.getExistingNames(destDir)
      const uniqueName = generateUniqueName(fileName, existingNames)
      const destPath = `${destDir}/${uniqueName}`

      await this.fs.copyFile(src, destPath)

      const node: FileTreeNode = {
        name: uniqueName,
        path: destPath,
        isDirectory: false,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      }
      addNodeToTree(destDir, node)

      return ok(destPath)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', 'コピーに失敗しました', src))
    }
  }

  async moveFile(src: string, destDir: string): Promise<Result<string>> {
    const srcValidation = this.pathValidator.validatePath(src)
    if (!srcValidation.ok) return srcValidation as Result<string>

    const destValidation = this.pathValidator.validatePath(destDir)
    if (!destValidation.ok) return destValidation as Result<string>

    try {
      const fileName = src.split('/').pop() ?? ''
      const destPath = `${destDir}/${fileName}`

      if (await this.fs.exists(destPath)) {
        return err(new FileSystemError('ALREADY_EXISTS', '移動先に同名のファイルが存在します', destPath))
      }

      await this.fs.rename(src, destPath)
      removeNodeFromTree(src)

      const node: FileTreeNode = {
        name: fileName,
        path: destPath,
        isDirectory: false,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      }
      addNodeToTree(destDir, node)

      // タブのパスを更新
      const tab = tabsState.tabs.find((t) => t.filePath === src)
      if (tab) {
        tab.filePath = destPath
      }

      return ok(destPath)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', '移動に失敗しました', src))
    }
  }

  copyPath(path: string): void {
    navigator.clipboard.writeText(path).then(() => {
      notify('info', 'パスをコピーしました')
    }).catch(() => {
      notify('error', 'クリップボードへのコピーに失敗しました')
    })
  }

  copyRelativePath(path: string): void {
    const relativePath = this.pathValidator.getRelativePath(path)
    navigator.clipboard.writeText(relativePath).then(() => {
      notify('info', '相対パスをコピーしました')
    }).catch(() => {
      notify('error', 'クリップボードへのコピーに失敗しました')
    })
  }

  // --- タブ管理 ---

  async openTab(path: string, maxTabs = 20): Promise<Result<Tab>> {
    // 既存タブチェック
    const existingTab = tabsState.tabs.find((t) => t.filePath === path)
    if (existingTab) {
      setActiveTab(path)
      return ok(existingTab)
    }

    // タブ上限チェック
    if (tabsState.tabs.length >= maxTabs) {
      const cleanTab = tabsState.tabs.find((t) => !t.isDirty && !t.isActive)
      if (cleanTab) {
        removeTab(cleanTab.filePath)
      } else {
        notify('warning', 'タブの上限に達しました。未保存のタブを保存してから再試行してください。')
        return err(new FileSystemError('IO_ERROR', 'タブの上限に達しました', path))
      }
    }

    const pathValidation = this.pathValidator.validatePath(path)
    if (!pathValidation.ok) return pathValidation as Result<Tab>

    try {
      const content = await this.fs.readFile(path)

      // バイナリ判定
      const encoder = new TextEncoder()
      const bytes = encoder.encode(content)
      if (containsNullByte(bytes)) {
        notify('warning', 'バイナリファイルは開けません')
        return err(new FileSystemError('IO_ERROR', 'バイナリファイルは開けません', path))
      }

      const fileName = path.split('/').pop() ?? ''
      const isExternal = !this.pathValidator.isWithinWorkspace(path)

      const tab: Tab = {
        filePath: path,
        displayName: fileName,
        content,
        isDirty: false,
        isActive: true,
        fileType: getFileType(fileName),
        cursorState: { ...DEFAULT_CURSOR_STATE },
        isExternal,
      }

      // 現在のアクティブタブを非アクティブに
      const currentActive = getActiveTab()
      if (currentActive) {
        currentActive.isActive = false
      }

      addTab(tab)
      return ok(tab)
    } catch (error) {
      return err(new FileSystemError('IO_ERROR', 'ファイルの読み込みに失敗しました', path))
    }
  }

  closeTab(path: string): void {
    const wasActive = tabsState.tabs.find((t) => t.filePath === path)?.isActive ?? false
    removeTab(path)

    if (wasActive) {
      this.activateAdjacentTab(path)
    }
  }

  switchTab(path: string): void {
    setActiveTab(path)
  }

  markDirty(path: string): void {
    const tab = tabsState.tabs.find((t) => t.filePath === path)
    if (tab) {
      tab.isDirty = true
      setSaveStatus('unsaved')
    }
  }

  reorderTabs(fromIndex: number, toIndex: number): void {
    reorderTabsInStore(fromIndex, toIndex)
  }

  getWorkspaceRoot(): string {
    return this.workspaceRoot
  }

  getDirtyTabs(): Tab[] {
    return getDirtyTabs()
  }

  getActiveTab(): Tab | null {
    return getActiveTab()
  }

  // --- プライベートメソッド ---

  private validateFileOperation(name: string, parentPath: string): ValidationResult {
    return validateFileName(name, parentPath)
  }

  private activateAdjacentTab(_closedPath: string): void {
    if (tabsState.tabs.length > 0) {
      const lastTab = tabsState.tabs[tabsState.tabs.length - 1]
      if (lastTab) {
        setActiveTab(lastTab.filePath)
      }
    }
  }

  private async getExistingNames(dirPath: string): Promise<Set<string>> {
    try {
      const entries = await this.fs.readDir(dirPath)
      return new Set(entries.map((e) => e.name))
    } catch {
      return new Set()
    }
  }
}
