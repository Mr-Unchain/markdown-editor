import { describe, it, expect, vi } from 'vitest'
import { atomicWriteSession, recoverSession } from '../atomic-write'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SessionState } from '$lib/types/workspace'

function createMockFs(overrides: Partial<FileSystemAdapter> = {}): FileSystemAdapter {
  return {
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readBinaryFile: vi.fn().mockResolvedValue(new Uint8Array()),
    writeBinaryFile: vi.fn().mockResolvedValue(undefined),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    rename: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    removeDir: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getFileInfo: vi.fn().mockResolvedValue({ size: 0, isSymlink: false, lastModified: 0 }),
    readFilePartial: vi.fn().mockResolvedValue(new Uint8Array()),
    watch: vi.fn().mockResolvedValue(() => Promise.resolve()),
    openFolderDialog: vi.fn().mockResolvedValue(null),
    openFileDialog: vi.fn().mockResolvedValue(null),
    saveFileDialog: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

const testSession: SessionState = {
  workspacePath: '/workspace/project',
  openTabs: [{ filePath: '/workspace/project/file.md', cursorPosition: 0, scrollTop: 0 }],
  activeTabPath: '/workspace/project/file.md',
  expandedFolders: ['/workspace/project/src'],
}

describe('atomicWriteSession', () => {
  it('既存ファイルがない場合、バックアップなしで書き込む', async () => {
    const fs = createMockFs()
    const result = await atomicWriteSession('/session.json', testSession, fs)

    expect(result.ok).toBe(true)
    expect(fs.copyFile).not.toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalledWith('/session.json.tmp', expect.any(String))
    expect(fs.rename).toHaveBeenCalledWith('/session.json.tmp', '/session.json')
  })

  it('既存ファイルがある場合、バックアップを作成してから書き込む', async () => {
    const fs = createMockFs({
      exists: vi.fn().mockResolvedValue(true),
    })
    const result = await atomicWriteSession('/session.json', testSession, fs)

    expect(result.ok).toBe(true)
    expect(fs.copyFile).toHaveBeenCalledWith('/session.json', '/session.json.bak')
    expect(fs.writeFile).toHaveBeenCalledWith('/session.json.tmp', expect.any(String))
    expect(fs.rename).toHaveBeenCalledWith('/session.json.tmp', '/session.json')
  })

  it('書き込みの操作順序が正しい（backup → write → rename）', async () => {
    const callOrder: string[] = []
    const fs = createMockFs({
      exists: vi.fn().mockResolvedValue(true),
      copyFile: vi.fn().mockImplementation(() => { callOrder.push('backup'); return Promise.resolve() }),
      writeFile: vi.fn().mockImplementation(() => { callOrder.push('write'); return Promise.resolve() }),
      rename: vi.fn().mockImplementation(() => { callOrder.push('rename'); return Promise.resolve() }),
    })

    await atomicWriteSession('/session.json', testSession, fs)
    expect(callOrder).toEqual(['backup', 'write', 'rename'])
  })

  it('書き込みエラー時にResult.errを返しtmpファイルをクリーンアップする', async () => {
    const fs = createMockFs({
      writeFile: vi.fn().mockRejectedValue(new Error('disk full')),
      exists: vi.fn().mockImplementation((path: string) =>
        Promise.resolve(path.endsWith('.tmp')),
      ),
    })

    const result = await atomicWriteSession('/session.json', testSession, fs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('IO_ERROR')
    }
    expect(fs.remove).toHaveBeenCalledWith('/session.json.tmp')
  })
})

describe('recoverSession', () => {
  it('メインファイルから正常に読み込む', async () => {
    const fs = createMockFs({
      exists: vi.fn().mockImplementation((path: string) =>
        Promise.resolve(path === '/session.json'),
      ),
      readFile: vi.fn().mockResolvedValue(JSON.stringify(testSession)),
    })

    const result = await recoverSession('/session.json', fs)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.workspacePath).toBe('/workspace/project')
    }
  })

  it('メインファイルがない場合、バックアップから復元する', async () => {
    const fs = createMockFs({
      exists: vi.fn().mockImplementation((path: string) =>
        Promise.resolve(path === '/session.json.bak'),
      ),
      readFile: vi.fn().mockResolvedValue(JSON.stringify(testSession)),
    })

    const result = await recoverSession('/session.json', fs)
    expect(result.ok).toBe(true)
    expect(fs.copyFile).toHaveBeenCalledWith('/session.json.bak', '/session.json')
  })

  it('両方のファイルがない場合、NOT_FOUNDエラーを返す', async () => {
    const fs = createMockFs({
      exists: vi.fn().mockResolvedValue(false),
    })

    const result = await recoverSession('/session.json', fs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
