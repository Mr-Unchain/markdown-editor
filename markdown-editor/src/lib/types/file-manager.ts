import type { FileTreeNode } from './workspace'

export interface ValidationResult {
  isValid: boolean
  error?: 'EMPTY' | 'TOO_LONG' | 'INVALID_CHARS' | 'RESERVED_NAME' | 'ALREADY_EXISTS' | 'PATH_TOO_LONG'
  message?: string
}

export type ContextMenuAction =
  | 'newFile'
  | 'newFolder'
  | 'newFileInFolder'
  | 'newFolderInFolder'
  | 'rename'
  | 'delete'
  | 'copyPath'
  | 'copyRelativePath'
  | 'copyFile'
  | 'moveFile'

export type ConflictAction = 'reload' | 'keep-local'

export interface RecoveryFile {
  originalPath: string
  recoveryPath: string
  content: string
  timestamp: number
}

export interface WatchEvent {
  type: 'create' | 'modify' | 'delete' | 'rename'
  paths: string[]
}

export interface FileInfo {
  size: number
  isSymlink: boolean
  lastModified: number
}

export interface ContextMenuState {
  isOpen: boolean
  position: { x: number; y: number }
  targetNode: FileTreeNode | null
}

export const DEFAULT_CONTEXT_MENU: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  targetNode: null,
}
