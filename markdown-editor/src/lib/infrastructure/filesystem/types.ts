import type { DirEntry, FileFilter } from '$lib/types/filesystem'

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

  openFolderDialog(): Promise<string | null>
  openFileDialog(filters?: FileFilter[]): Promise<string | null>
  saveFileDialog(defaultName?: string): Promise<string | null>
}
