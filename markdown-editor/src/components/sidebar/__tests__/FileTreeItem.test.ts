import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import FileTreeItem from '../FileTreeItem.svelte'
import type { FileTreeNode } from '$lib/types/workspace'

function createNode(name: string, isDirectory = false, isExpanded = false): FileTreeNode {
  return {
    name,
    path: `/workspace/${name}`,
    isDirectory,
    children: [],
    isExpanded,
    isLoaded: true,
    isSelected: false,
  }
}

describe('FileTreeItem', () => {
  it('ファイルノードのノード名を表示する', () => {
    render(FileTreeItem, { props: { node: createNode('readme.md') } })
    expect(screen.getByText('readme.md')).toBeTruthy()
  })

  it('role="treeitem"属性が設定されている', () => {
    render(FileTreeItem, { props: { node: createNode('readme.md') } })
    expect(screen.getByRole('treeitem')).toBeTruthy()
  })

  it('ディレクトリノードにaria-expandedが設定される', () => {
    render(FileTreeItem, { props: { node: createNode('src', true, false) } })
    const item = screen.getByRole('treeitem')
    expect(item.getAttribute('aria-expanded')).toBe('false')
  })

  it('ファイルノードにはaria-expandedが設定されない', () => {
    render(FileTreeItem, { props: { node: createNode('file.md') } })
    const item = screen.getByRole('treeitem')
    expect(item.getAttribute('aria-expanded')).toBeNull()
  })
})
