import type { DirEntry, FileFilter } from '$lib/types/filesystem'
import type { FileSystemAdapter } from './types'

export class WebFileSystemAdapter implements FileSystemAdapter {
  private dirHandles = new Map<string, FileSystemDirectoryHandle>()

  async readFile(path: string): Promise<string> {
    const fileHandle = await this.getFileHandle(path)
    const file = await fileHandle.getFile()
    return file.text()
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fileHandle = await this.getFileHandle(path, true)
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const fileHandle = await this.getFileHandle(path)
    const file = await fileHandle.getFile()
    const buffer = await file.arrayBuffer()
    return new Uint8Array(buffer)
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    const fileHandle = await this.getFileHandle(path, true)
    const writable = await fileHandle.createWritable()
    await writable.write(data)
    await writable.close()
  }

  async readDir(path: string): Promise<DirEntry[]> {
    const dirHandle = this.dirHandles.get(path)
    if (!dirHandle) {
      throw new Error(`Directory not opened: ${path}`)
    }

    const entries: DirEntry[] = []
    for await (const [name, handle] of dirHandle.entries()) {
      entries.push({
        name,
        path: `${path}/${name}`,
        isDirectory: handle.kind === 'directory',
      })
    }

    return entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  async mkdir(path: string): Promise<void> {
    const { parentPath, name } = this.splitPath(path)
    const parentHandle = this.dirHandles.get(parentPath)
    if (!parentHandle) {
      throw new Error(`Parent directory not opened: ${parentPath}`)
    }
    const newDirHandle = await parentHandle.getDirectoryHandle(name, { create: true })
    this.dirHandles.set(path, newDirHandle)
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { parentPath, name } = this.splitPath(path)
      const parentHandle = this.dirHandles.get(parentPath)
      if (!parentHandle) return false

      try {
        await parentHandle.getFileHandle(name)
        return true
      } catch {
        try {
          await parentHandle.getDirectoryHandle(name)
          return true
        } catch {
          return false
        }
      }
    } catch {
      return false
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    // Web FS Access API does not support rename directly.
    // Implement as copy + delete.
    const content = await this.readFile(oldPath)
    await this.writeFile(newPath, content)
    await this.remove(oldPath)
  }

  async remove(path: string): Promise<void> {
    const { parentPath, name } = this.splitPath(path)
    const parentHandle = this.dirHandles.get(parentPath)
    if (!parentHandle) {
      throw new Error(`Parent directory not opened: ${parentPath}`)
    }
    await parentHandle.removeEntry(name, { recursive: true })
    this.dirHandles.delete(path)
  }

  async openFolderDialog(): Promise<string | null> {
    try {
      const handle = await window.showDirectoryPicker()
      const path = `/${handle.name}`
      this.dirHandles.set(path, handle)
      await this.indexSubdirectories(path, handle)
      return path
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return null
      throw e
    }
  }

  async openFileDialog(filters?: FileFilter[]): Promise<string | null> {
    try {
      const types = filters?.map((f) => ({
        description: f.name,
        accept: {
          'application/octet-stream': f.extensions.map((ext) => `.${ext}`),
        },
      }))
      const [handle] = await window.showOpenFilePicker({ types, multiple: false })
      if (!handle) return null
      return `/${handle.name}`
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return null
      throw e
    }
  }

  async saveFileDialog(defaultName?: string): Promise<string | null> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName,
      })
      return `/${handle.name}`
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return null
      throw e
    }
  }

  private async getFileHandle(
    path: string,
    create = false,
  ): Promise<FileSystemFileHandle> {
    const { parentPath, name } = this.splitPath(path)
    const parentHandle = this.dirHandles.get(parentPath)
    if (!parentHandle) {
      throw new Error(`Parent directory not opened: ${parentPath}`)
    }
    return parentHandle.getFileHandle(name, { create })
  }

  private splitPath(path: string): { parentPath: string; name: string } {
    const lastSlash = path.lastIndexOf('/')
    if (lastSlash <= 0) {
      return { parentPath: '/', name: path.replace(/^\//, '') }
    }
    return {
      parentPath: path.substring(0, lastSlash),
      name: path.substring(lastSlash + 1),
    }
  }

  private async indexSubdirectories(
    basePath: string,
    handle: FileSystemDirectoryHandle,
  ): Promise<void> {
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === 'directory') {
        const childPath = `${basePath}/${name}`
        this.dirHandles.set(childPath, entry as FileSystemDirectoryHandle)
      }
    }
  }
}
