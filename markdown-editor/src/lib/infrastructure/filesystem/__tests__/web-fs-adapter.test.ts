import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebFileSystemAdapter } from '../web-fs-adapter'

describe('WebFileSystemAdapter', () => {
  let adapter: WebFileSystemAdapter

  beforeEach(() => {
    adapter = new WebFileSystemAdapter()
  })

  it('readDir throws when directory not opened', async () => {
    await expect(adapter.readDir('/unknown')).rejects.toThrow('Directory not opened')
  })

  it('openFolderDialog returns null on abort', async () => {
    // @ts-expect-error - mock showDirectoryPicker
    window.showDirectoryPicker = vi.fn().mockRejectedValue(
      new DOMException('User aborted', 'AbortError'),
    )
    const result = await adapter.openFolderDialog()
    expect(result).toBeNull()
    // @ts-expect-error - cleanup
    delete window.showDirectoryPicker
  })

  it('openFileDialog returns null on abort', async () => {
    // @ts-expect-error - mock showOpenFilePicker
    window.showOpenFilePicker = vi.fn().mockRejectedValue(
      new DOMException('User aborted', 'AbortError'),
    )
    const result = await adapter.openFileDialog()
    expect(result).toBeNull()
    // @ts-expect-error - cleanup
    delete window.showOpenFilePicker
  })

  it('saveFileDialog returns null on abort', async () => {
    // @ts-expect-error - mock showSaveFilePicker
    window.showSaveFilePicker = vi.fn().mockRejectedValue(
      new DOMException('User aborted', 'AbortError'),
    )
    const result = await adapter.saveFileDialog()
    expect(result).toBeNull()
    // @ts-expect-error - cleanup
    delete window.showSaveFilePicker
  })

  it('exists returns false when parent directory not opened', async () => {
    const result = await adapter.exists('/unknown/file.md')
    expect(result).toBe(false)
  })
})
