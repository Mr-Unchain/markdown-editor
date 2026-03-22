import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import FileTree from '../FileTree.svelte'
import type { FileTreeNode } from '$lib/types/workspace'

function createNode(name: string, isDirectory = false, children: FileTreeNode[] = [], isExpanded = false): FileTreeNode {
  return {
    name,
    path: `/workspace/${name}`,
    isDirectory,
    children,
    isExpanded,
    isLoaded: true,
    isSelected: false,
  }
}

describe('FileTree', () => {
  it('空のノード一覧で空メッセージを表示する', () => {
    render(FileTree, { props: { nodes: [] } })
    expect(screen.getByTestId('file-tree-empty')).toBeTruthy()
  })

  it('ノード一覧をレンダリングする', () => {
    const nodes = [
      createNode('src', true),
      createNode('README.md'),
    ]
    render(FileTree, { props: { nodes } })
    expect(screen.getByRole('tree')).toBeTruthy()
  })

  it('role="tree"属性が設定されている', () => {
    const nodes = [createNode('file.md')]
    render(FileTree, { props: { nodes } })
    const tree = screen.getByRole('tree')
    expect(tree.getAttribute('aria-label')).toBe('ファイルツリー')
  })

  it('data-testid="file-tree"が設定されている', () => {
    const nodes = [createNode('file.md')]
    render(FileTree, { props: { nodes } })
    expect(screen.getByTestId('file-tree')).toBeTruthy()
  })
})
