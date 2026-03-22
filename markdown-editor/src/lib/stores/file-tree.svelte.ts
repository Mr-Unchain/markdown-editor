import type { FileTreeNode } from '$lib/types/workspace'
import type { FileFilter } from '$lib/types/workspace'
import { DEFAULT_FILE_FILTER } from '$lib/types/workspace'

export interface FileTreeState {
  nodes: FileTreeNode[]
  filter: FileFilter
  selectedPath: string | null
}

export const fileTreeState = $state<FileTreeState>({
  nodes: [],
  filter: { ...DEFAULT_FILE_FILTER },
  selectedPath: null,
})

export function setFileTreeNodes(nodes: FileTreeNode[]): void {
  fileTreeState.nodes = nodes
}

export function setSelectedPath(path: string | null): void {
  fileTreeState.selectedPath = path
}

export function toggleNodeExpanded(path: string): void {
  const node = findNodeByPath(fileTreeState.nodes, path)
  if (node && node.isDirectory) {
    node.isExpanded = !node.isExpanded
  }
}

export function setNodeChildren(path: string, children: FileTreeNode[]): void {
  const node = findNodeByPath(fileTreeState.nodes, path)
  if (node) {
    node.children = children
    node.isLoaded = true
  }
}

export function setNodeExpanded(path: string, expanded: boolean): void {
  const node = findNodeByPath(fileTreeState.nodes, path)
  if (node) {
    node.isExpanded = expanded
  }
}

export function addNodeToTree(parentPath: string, newNode: FileTreeNode): void {
  if (!parentPath) {
    fileTreeState.nodes = [...fileTreeState.nodes, newNode]
    return
  }
  const parent = findNodeByPath(fileTreeState.nodes, parentPath)
  if (parent && parent.isDirectory) {
    parent.children = [...parent.children, newNode]
  }
}

export function removeNodeFromTree(path: string): void {
  fileTreeState.nodes = removeNodeRecursive(fileTreeState.nodes, path)
}

export function renameNodeInTree(oldPath: string, newPath: string, newName: string): void {
  const node = findNodeByPath(fileTreeState.nodes, oldPath)
  if (node) {
    node.path = newPath
    node.name = newName
  }
}

export function setFileFilter(filter: Partial<FileFilter>): void {
  Object.assign(fileTreeState.filter, filter)
}

export function resetFileTreeState(): void {
  fileTreeState.nodes = []
  fileTreeState.filter = { ...DEFAULT_FILE_FILTER }
  fileTreeState.selectedPath = null
}

function findNodeByPath(nodes: FileTreeNode[], path: string): FileTreeNode | null {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.isDirectory && node.children.length > 0) {
      const found = findNodeByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}

function removeNodeRecursive(nodes: FileTreeNode[], path: string): FileTreeNode[] {
  return nodes
    .filter((n) => n.path !== path)
    .map((n) => {
      if (n.isDirectory && n.children.length > 0) {
        return { ...n, children: removeNodeRecursive(n.children, path) }
      }
      return n
    })
}
