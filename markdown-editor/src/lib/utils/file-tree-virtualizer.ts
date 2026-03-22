import type { FileTreeNode } from '$lib/types/workspace'

export interface VisibleRange {
  startIndex: number
  endIndex: number
  offsetY: number
}

const ITEM_HEIGHT = 28
const BUFFER_SIZE = 20
const VIRTUAL_SCROLL_THRESHOLD = 200

export class FileTreeVirtualizer {
  private flatNodes: FileTreeNode[] = []

  get itemHeight(): number {
    return ITEM_HEIGHT
  }

  get nodeCount(): number {
    return this.flatNodes.length
  }

  get shouldVirtualize(): boolean {
    return this.flatNodes.length > VIRTUAL_SCROLL_THRESHOLD
  }

  flatten(roots: FileTreeNode[]): FileTreeNode[] {
    this.flatNodes = []
    this.flattenRecursive(roots)
    return this.flatNodes
  }

  private flattenRecursive(nodes: FileTreeNode[]): void {
    for (const node of nodes) {
      this.flatNodes.push(node)
      if (node.isDirectory && node.isExpanded && node.children.length > 0) {
        this.flattenRecursive(node.children)
      }
    }
  }

  getVisibleRange(scrollTop: number, containerHeight: number): VisibleRange {
    const totalCount = this.flatNodes.length
    if (totalCount === 0) {
      return { startIndex: 0, endIndex: 0, offsetY: 0 }
    }

    const rawStart = Math.floor(scrollTop / ITEM_HEIGHT)
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT)

    const startIndex = Math.max(0, rawStart - BUFFER_SIZE)
    const endIndex = Math.min(totalCount, rawStart + visibleCount + BUFFER_SIZE)
    const offsetY = startIndex * ITEM_HEIGHT

    return { startIndex, endIndex, offsetY }
  }

  getVisibleNodes(range: VisibleRange): FileTreeNode[] {
    return this.flatNodes.slice(range.startIndex, range.endIndex)
  }

  getTotalHeight(): number {
    return this.flatNodes.length * ITEM_HEIGHT
  }
}
