import { describe, it, expect, vi } from 'vitest'
import { FileTreeLoader, applyFilter, sortNodes } from '../file-tree-loader'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { FileTreeNode, FileFilter } from '$lib/types/workspace'

function createMockFs(entries: Array<{ name: string; path: string; isDirectory: boolean }> = []): FileSystemAdapter {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    readDir: vi.fn().mockResolvedValue(entries),
    mkdir: vi.fn(),
    exists: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    removeDir: vi.fn(),
    copyFile: vi.fn(),
    getFileInfo: vi.fn(),
    readFilePartial: vi.fn(),
    watch: vi.fn(),
    openFolderDialog: vi.fn(),
    openFileDialog: vi.fn(),
    saveFileDialog: vi.fn(),
  }
}

function createNode(name: string, isDirectory = false, overrides: Partial<FileTreeNode> = {}): FileTreeNode {
  return {
    name,
    path: `/workspace/${name}`,
    isDirectory,
    children: [],
    isExpanded: false,
    isLoaded: false,
    isSelected: false,
    ...overrides,
  }
}

describe('FileTreeLoader', () => {
  describe('loadRootEntries', () => {
    it('ルートディレクトリのエントリを読み込む', async () => {
      const entries = [
        { name: 'src', path: '/workspace/src', isDirectory: true },
        { name: 'README.md', path: '/workspace/README.md', isDirectory: false },
      ]
      const fs = createMockFs(entries)
      const loader = new FileTreeLoader(fs)

      const result = await loader.loadRootEntries('/workspace')

      expect(result).toHaveLength(2)
      expect(fs.readDir).toHaveBeenCalledWith('/workspace')
    })

    it('ディレクトリ優先でソートされる', async () => {
      const entries = [
        { name: 'b.md', path: '/workspace/b.md', isDirectory: false },
        { name: 'a-dir', path: '/workspace/a-dir', isDirectory: true },
        { name: 'a.md', path: '/workspace/a.md', isDirectory: false },
      ]
      const fs = createMockFs(entries)
      const loader = new FileTreeLoader(fs)

      const result = await loader.loadRootEntries('/workspace')

      expect(result.map(n => n.name)).toEqual(['a-dir', 'a.md', 'b.md'])
    })

    it('各ノードがisLoaded=false, isExpanded=falseで生成される', async () => {
      const entries = [
        { name: 'src', path: '/workspace/src', isDirectory: true },
      ]
      const fs = createMockFs(entries)
      const loader = new FileTreeLoader(fs)

      const result = await loader.loadRootEntries('/workspace')

      expect(result[0]!.isLoaded).toBe(false)
      expect(result[0]!.isExpanded).toBe(false)
      expect(result[0]!.children).toEqual([])
    })
  })

  describe('loadChildren', () => {
    it('キャッシュ済みノードのchildrenを返す', async () => {
      const fs = createMockFs()
      const loader = new FileTreeLoader(fs)

      const cachedNode = createNode('src', true, {
        isLoaded: true,
        children: [createNode('index.ts')],
      })

      const result = await loader.loadChildren('/workspace/src', cachedNode)

      expect(result).toEqual(cachedNode.children)
      expect(fs.readDir).not.toHaveBeenCalled()
    })

    it('未読み込みノードはfsから読み込む', async () => {
      const entries = [
        { name: 'index.ts', path: '/workspace/src/index.ts', isDirectory: false },
      ]
      const fs = createMockFs(entries)
      const loader = new FileTreeLoader(fs)

      const result = await loader.loadChildren('/workspace/src')

      expect(result).toHaveLength(1)
      expect(fs.readDir).toHaveBeenCalledWith('/workspace/src')
    })
  })

  describe('reloadChildren', () => {
    it('常にfsから再読み込みする', async () => {
      const entries = [
        { name: 'new-file.md', path: '/workspace/src/new-file.md', isDirectory: false },
      ]
      const fs = createMockFs(entries)
      const loader = new FileTreeLoader(fs)

      const result = await loader.reloadChildren('/workspace/src')

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('new-file.md')
      expect(fs.readDir).toHaveBeenCalledWith('/workspace/src')
    })
  })
})

describe('applyFilter', () => {
  const nodes = [
    createNode('.hidden', false),
    createNode('.git', true),
    createNode('src', true),
    createNode('readme.md', false),
    createNode('style.css', false),
  ]

  it('隠しファイルを非表示にする', () => {
    const filter: FileFilter = { showHiddenFiles: false, extensionFilter: [], isFilterActive: false }
    const result = applyFilter(nodes, filter)
    expect(result.map(n => n.name)).toEqual(['src', 'readme.md', 'style.css'])
  })

  it('隠しファイルを表示する', () => {
    const filter: FileFilter = { showHiddenFiles: true, extensionFilter: [], isFilterActive: false }
    const result = applyFilter(nodes, filter)
    expect(result).toHaveLength(5)
  })

  it('拡張子フィルターを適用する', () => {
    const filter: FileFilter = { showHiddenFiles: false, extensionFilter: ['md'], isFilterActive: true }
    const result = applyFilter(nodes, filter)
    // ディレクトリは拡張子フィルターの影響を受けない
    expect(result.map(n => n.name)).toEqual(['src', 'readme.md'])
  })
})

describe('sortNodes', () => {
  it('ディレクトリ優先、名前アルファベット順', () => {
    const nodes = [
      createNode('z.md', false),
      createNode('b-dir', true),
      createNode('a.md', false),
      createNode('a-dir', true),
    ]
    const result = sortNodes(nodes)
    expect(result.map(n => n.name)).toEqual(['a-dir', 'b-dir', 'a.md', 'z.md'])
  })

  it('大文字小文字を区別しないソート', () => {
    const nodes = [
      createNode('Banana.md', false),
      createNode('apple.md', false),
    ]
    const result = sortNodes(nodes)
    expect(result.map(n => n.name)).toEqual(['apple.md', 'Banana.md'])
  })
})
