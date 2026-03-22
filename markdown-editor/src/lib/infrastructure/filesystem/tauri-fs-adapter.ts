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
  copyFile as tauriCopyFile,
  stat as tauriStat,
  watch as tauriWatch,
  open as tauriOpen,
} from '@tauri-apps/plugin-fs'
import { open, save } from '@tauri-apps/plugin-dialog'
import type { DirEntry, FileFilter } from '$lib/types/filesystem'
import type { FileInfo, WatchEvent } from '$lib/types/file-manager'
import type { FileSystemAdapter, UnwatchFn, WatchOptions } from './types'

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
    await tauriRemove(path)
  }

  async removeDir(path: string, options?: { recursive: boolean }): Promise<void> {
    await tauriRemove(path, { recursive: options?.recursive ?? false })
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await tauriCopyFile(src, dest)
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    const info = await tauriStat(path)
    return {
      size: info.size,
      isSymlink: info.isSymlink,
      lastModified: info.mtime?.getTime() ?? 0,
    }
  }

  async readFilePartial(path: string, offset: number, length: number): Promise<Uint8Array> {
    const file = await tauriOpen(path, { read: true })
    try {
      await file.seek(offset)
      const buffer = new Uint8Array(length)
      await file.read(buffer)
      return buffer
    } finally {
      await file.close()
    }
  }

  async watch(
    path: string,
    callback: (event: WatchEvent) => void,
    options?: WatchOptions,
  ): Promise<UnwatchFn> {
    const unwatch = await tauriWatch(
      path,
      (event) => {
        const watchEvent: WatchEvent = {
          type: this.mapEventType(event.type),
          paths: typeof event.paths === 'undefined' ? [] : event.paths.map(String),
        }
        callback(watchEvent)
      },
      { recursive: options?.recursive ?? true },
    )
    return async () => unwatch()
  }

  private mapEventType(type: string | unknown): WatchEvent['type'] {
    const typeStr = String(type).toLowerCase()
    if (typeStr.includes('create')) return 'create'
    if (typeStr.includes('modify') || typeStr.includes('write')) return 'modify'
    if (typeStr.includes('remove') || typeStr.includes('delete')) return 'delete'
    if (typeStr.includes('rename')) return 'rename'
    return 'modify'
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
