import type { DirEntry, FileFilter } from '$lib/types/filesystem'
import type { FileInfo, WatchEvent } from '$lib/types/file-manager'

export type UnwatchFn = () => Promise<void>

export interface WatchOptions {
  recursive: boolean
  debounceMs: number
}

export interface FileSystemAdapter {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  readBinaryFile(path: string): Promise<Uint8Array>
  writeBinaryFile(path: string, data: Uint8Array): Promise<void>

  readDir(path: string): Promise<DirEntry[]>
  mkdir(path: string): Promise<void>
  exists(path: string): Promise<boolean>

  rename(oldPath: string, newPath: string): Promise<void>
  remove(path: string): Promise<void>
  removeDir(path: string, options?: { recursive: boolean }): Promise<void>

  copyFile(src: string, dest: string): Promise<void>

  getFileInfo(path: string): Promise<FileInfo>
  readFilePartial(path: string, offset: number, length: number): Promise<Uint8Array>

  watch(
    path: string,
    callback: (event: WatchEvent) => void,
    options?: WatchOptions,
  ): Promise<UnwatchFn>

  openFolderDialog(): Promise<string | null>
  openFileDialog(filters?: FileFilter[]): Promise<string | null>
  saveFileDialog(defaultName?: string): Promise<string | null>
}
