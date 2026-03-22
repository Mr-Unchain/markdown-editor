import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { FileTreeNode, FileFilter } from '$lib/types/workspace'

export class FileTreeLoader {
  constructor(private fs: FileSystemAdapter) {}

  async loadRootEntries(rootPath: string): Promise<FileTreeNode[]> {
    const entries = await this.fs.readDir(rootPath)
    return sortNodes(
      entries.map((entry) => ({
        name: entry.name,
        path: entry.path,
        isDirectory: entry.isDirectory,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      })),
    )
  }

  async loadChildren(folderPath: string, cachedNode?: FileTreeNode): Promise<FileTreeNode[]> {
    if (cachedNode?.isLoaded) {
      return cachedNode.children
    }
    return this.fetchChildren(folderPath)
  }

  async reloadChildren(folderPath: string): Promise<FileTreeNode[]> {
    return this.fetchChildren(folderPath)
  }

  private async fetchChildren(folderPath: string): Promise<FileTreeNode[]> {
    const entries = await this.fs.readDir(folderPath)
    return sortNodes(
      entries.map((entry) => ({
        name: entry.name,
        path: entry.path,
        isDirectory: entry.isDirectory,
        children: [],
        isExpanded: false,
        isLoaded: false,
        isSelected: false,
      })),
    )
  }
}

export function applyFilter(nodes: FileTreeNode[], filter: FileFilter): FileTreeNode[] {
  return sortNodes(
    nodes.filter((node) => {
      if (!filter.showHiddenFiles && node.name.startsWith('.')) return false
      if (!node.isDirectory && filter.extensionFilter.length > 0) {
        const ext = node.name.split('.').pop() ?? ''
        return filter.extensionFilter.includes(ext)
      }
      return true
    }),
  )
}

export function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}
