import type { FileSystemAdapter } from './types'
import { TauriFileSystemAdapter } from './tauri-fs-adapter'
import { WebFileSystemAdapter } from './web-fs-adapter'

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function createFileSystemAdapter(): FileSystemAdapter {
  if (isTauri()) {
    return new TauriFileSystemAdapter()
  }
  if (isFileSystemAccessSupported()) {
    return new WebFileSystemAdapter()
  }
  throw new Error('お使いの環境はサポートされていません。Chrome 86以上またはTauriデスクトップ版をご利用ください。')
}
