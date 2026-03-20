import {
  readTextFile,
  writeTextFile,
  readFile as tauriReadFile,
  writeFile as tauriWriteFile,
  readDir as tauriReadDir,
  mkdir as tauriMkdir,
  exists as tauriExists,
  rename as tauriRename,
  remove as tauriRemove,
} from '@tauri-apps/plugin-fs'
import { open, save } from '@tauri-apps/plugin-dialog'
import type { DirEntry, FileFilter } from '$lib/types/filesystem'
import type { FileSystemAdapter } from './types'

export class TauriFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return readTextFile(path)
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeTextFile(path, content)
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    return tauriReadFile(path)
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    await tauriWriteFile(path, data)
  }

  async readDir(path: string): Promise<DirEntry[]> {
    const entries = await tauriReadDir(path)
    return entries.map((entry) => ({
      name: entry.name ?? '',
      path: `${path}/${entry.name}`,
      isDirectory: entry.isDirectory ?? false,
    }))
  }

  async mkdir(path: string): Promise<void> {
    await tauriMkdir(path, { recursive: true })
  }

  async exists(path: string): Promise<boolean> {
    return tauriExists(path)
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await tauriRename(oldPath, newPath)
  }

  async remove(path: string): Promise<void> {
    await tauriRemove(path, { recursive: true })
  }

  async openFolderDialog(): Promise<string | null> {
    const selected = await open({ directory: true, multiple: false })
    return selected ?? null
  }

  async openFileDialog(filters?: FileFilter[]): Promise<string | null> {
    const dialogFilters = filters?.map((f) => ({
      name: f.name,
      extensions: f.extensions,
    }))
    const selected = await open({
      multiple: false,
      filters: dialogFilters,
    })
    return selected ?? null
  }

  async saveFileDialog(defaultName?: string): Promise<string | null> {
    const selected = await save({
      defaultPath: defaultName,
    })
    return selected ?? null
  }
}
