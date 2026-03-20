import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readDir: vi.fn(),
  mkdir: vi.fn(),
  exists: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}))

import { TauriFileSystemAdapter } from '../tauri-fs-adapter'
import * as fs from '@tauri-apps/plugin-fs'
import * as dialog from '@tauri-apps/plugin-dialog'

describe('TauriFileSystemAdapter', () => {
  let adapter: TauriFileSystemAdapter

  beforeEach(() => {
    adapter = new TauriFileSystemAdapter()
    vi.clearAllMocks()
  })

  it('readFile calls readTextFile', async () => {
    vi.mocked(fs.readTextFile).mockResolvedValue('# Hello')
    const result = await adapter.readFile('/test.md')
    expect(result).toBe('# Hello')
    expect(fs.readTextFile).toHaveBeenCalledWith('/test.md')
  })

  it('writeFile calls writeTextFile', async () => {
    vi.mocked(fs.writeTextFile).mockResolvedValue()
    await adapter.writeFile('/test.md', '# Hello')
    expect(fs.writeTextFile).toHaveBeenCalledWith('/test.md', '# Hello')
  })

  it('readDir maps entries correctly', async () => {
    vi.mocked(fs.readDir).mockResolvedValue([
      { name: 'file.md', isDirectory: false, isFile: true, isSymlink: false },
      { name: 'subdir', isDirectory: true, isFile: false, isSymlink: false },
    ])
    const entries = await adapter.readDir('/workspace')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      name: 'file.md',
      path: '/workspace/file.md',
      isDirectory: false,
    })
    expect(entries[1]).toEqual({
      name: 'subdir',
      path: '/workspace/subdir',
      isDirectory: true,
    })
  })

  it('mkdir calls with recursive option', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue()
    await adapter.mkdir('/workspace/new-dir')
    expect(fs.mkdir).toHaveBeenCalledWith('/workspace/new-dir', { recursive: true })
  })

  it('exists delegates to Tauri exists', async () => {
    vi.mocked(fs.exists).mockResolvedValue(true)
    const result = await adapter.exists('/test.md')
    expect(result).toBe(true)
  })

  it('openFolderDialog calls open with directory option', async () => {
    vi.mocked(dialog.open).mockResolvedValue('/selected/folder')
    const result = await adapter.openFolderDialog()
    expect(result).toBe('/selected/folder')
    expect(dialog.open).toHaveBeenCalledWith({ directory: true, multiple: false })
  })

  it('openFolderDialog returns null when cancelled', async () => {
    vi.mocked(dialog.open).mockResolvedValue(null)
    const result = await adapter.openFolderDialog()
    expect(result).toBeNull()
  })

  it('saveFileDialog calls save with defaultPath', async () => {
    vi.mocked(dialog.save).mockResolvedValue('/output/file.md')
    const result = await adapter.saveFileDialog('article.md')
    expect(result).toBe('/output/file.md')
    expect(dialog.save).toHaveBeenCalledWith({ defaultPath: 'article.md' })
  })
})
