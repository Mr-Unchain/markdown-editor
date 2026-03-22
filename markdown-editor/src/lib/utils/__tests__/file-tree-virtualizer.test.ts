import { describe, it, expect } from 'vitest'
import { FileTreeVirtualizer } from '../file-tree-virtualizer'
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

describe('FileTreeVirtualizer', () => {
  const virtualizer = new FileTreeVirtualizer()

  describe('flatten', () => {
    it('フラットなファイルリストを正しくフラット化する', () => {
      const nodes = [createNode('a.md'), createNode('b.md'), createNode('c.md')]
      const result = virtualizer.flatten(nodes)
      expect(result).toHaveLength(3)
      expect(result.map(n => n.name)).toEqual(['a.md', 'b.md', 'c.md'])
    })

    it('展開済みフォルダの子ノードを含める', () => {
      const folder = createNode('src', true, [
        createNode('index.ts'),
        createNode('app.ts'),
      ], true)
      const result = virtualizer.flatten([folder])
      expect(result).toHaveLength(3)
      expect(result.map(n => n.name)).toEqual(['src', 'index.ts', 'app.ts'])
    })

    it('折り畳まれたフォルダの子ノードを含めない', () => {
      const folder = createNode('src', true, [
        createNode('index.ts'),
      ], false)
      const result = virtualizer.flatten([folder])
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('src')
    })

    it('ネストされた展開フォルダを再帰的にフラット化する', () => {
      const inner = createNode('components', true, [
        createNode('App.svelte'),
      ], true)
      const outer = createNode('src', true, [inner], true)
      const result = virtualizer.flatten([outer])
      expect(result).toHaveLength(3)
      expect(result.map(n => n.name)).toEqual(['src', 'components', 'App.svelte'])
    })
  })

  describe('getVisibleRange', () => {
    it('スクロール位置0で先頭からの範囲を返す', () => {
      const nodes = Array.from({ length: 300 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)

      const range = virtualizer.getVisibleRange(0, 500)
      expect(range.startIndex).toBe(0)
      expect(range.offsetY).toBe(0)
      expect(range.endIndex).toBeGreaterThan(0)
    })

    it('空のリストで安全なデフォルト値を返す', () => {
      virtualizer.flatten([])
      const range = virtualizer.getVisibleRange(0, 500)
      expect(range.startIndex).toBe(0)
      expect(range.endIndex).toBe(0)
      expect(range.offsetY).toBe(0)
    })

    it('スクロール位置に応じてオフセットを計算する', () => {
      const nodes = Array.from({ length: 300 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)

      const range = virtualizer.getVisibleRange(2800, 500)
      // scrollTop 2800 / itemHeight 28 = 100
      // startIndex = max(0, 100 - 20) = 80
      expect(range.startIndex).toBe(80)
      expect(range.offsetY).toBe(80 * 28)
    })
  })

  describe('getVisibleNodes', () => {
    it('指定範囲のノードを返す', () => {
      const nodes = Array.from({ length: 50 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)

      const result = virtualizer.getVisibleNodes({ startIndex: 10, endIndex: 20, offsetY: 280 })
      expect(result).toHaveLength(10)
      expect(result[0]!.name).toBe('file10.md')
    })
  })

  describe('getTotalHeight', () => {
    it('全ノード数 × アイテム高さを返す', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)
      expect(virtualizer.getTotalHeight()).toBe(100 * 28)
    })
  })

  describe('shouldVirtualize', () => {
    it('200ノード以下ではfalseを返す', () => {
      const nodes = Array.from({ length: 200 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)
      expect(virtualizer.shouldVirtualize).toBe(false)
    })

    it('200ノード超でtrueを返す', () => {
      const nodes = Array.from({ length: 201 }, (_, i) => createNode(`file${i}.md`))
      virtualizer.flatten(nodes)
      expect(virtualizer.shouldVirtualize).toBe(true)
    })
  })
})
