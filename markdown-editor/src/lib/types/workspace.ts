export interface Workspace {
  rootPath: string
  name: string
  fileTree: FileTreeNode[]
  isOpen: boolean
}

export interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: FileTreeNode[]
  isExpanded: boolean
  isLoaded: boolean
  isSelected: boolean
}

export interface Tab {
  filePath: string
  displayName: string
  content: string | null
  isDirty: boolean
  isActive: boolean
  fileType: 'markdown' | 'plaintext'
  cursorState: TabCursorState
  isExternal: boolean
}

export interface TabCursorState {
  cursorPosition: number
  scrollTop: number
  selection: { from: number; to: number } | null
}

export interface SessionState {
  workspacePath: string | null
  openTabs: SessionTab[]
  activeTabPath: string | null
  expandedFolders: string[]
}

export interface SessionTab {
  filePath: string
  cursorPosition: number
  scrollTop: number
}

export interface RecentWorkspace {
  path: string
  name: string
  lastAccessedAt: string
}

export interface FileFilter {
  showHiddenFiles: boolean
  extensionFilter: string[]
  isFilterActive: boolean
}

export interface AutoSaveConfig {
  mode: 'auto' | 'manual'
  debounceMs: number
}

export const DEFAULT_FILE_FILTER: FileFilter = {
  showHiddenFiles: false,
  extensionFilter: [],
  isFilterActive: false,
}

export const DEFAULT_AUTO_SAVE: AutoSaveConfig = {
  mode: 'manual',
  debounceMs: 1000,
}

export const DEFAULT_CURSOR_STATE: TabCursorState = {
  cursorPosition: 0,
  scrollTop: 0,
  selection: null,
}
