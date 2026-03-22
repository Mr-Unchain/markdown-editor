import { describe, it, expect } from 'vitest'
import {
  validateFileName,
  generateUniqueName,
  getFileType,
  containsNullByte,
} from '../file-name-validator'

describe('validateFileName', () => {
  const parentPath = '/workspace/project'

  it('正常なファイル名を許可する', () => {
    const result = validateFileName('document.md', parentPath)
    expect(result.isValid).toBe(true)
  })

  it('空文字を拒否する', () => {
    const result = validateFileName('', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('EMPTY')
  })

  it('空白のみの名前を拒否する', () => {
    const result = validateFileName('   ', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('EMPTY')
  })

  it('255文字を超える名前を拒否する', () => {
    const longName = 'a'.repeat(256)
    const result = validateFileName(longName, parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('TOO_LONG')
  })

  it('255文字ちょうどの名前はパス長制限内なら許可する', () => {
    const name = 'a'.repeat(200)
    const result = validateFileName(name, '/w')
    expect(result.isValid).toBe(true)
  })

  it.each(['\\', '/', ':', '*', '?', '"', '<', '>', '|'])(
    '禁止文字「%s」を含む名前を拒否する',
    (char) => {
      const result = validateFileName(`file${char}name.md`, parentPath)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('INVALID_CHARS')
    },
  )

  it('制御文字を含む名前を拒否する', () => {
    const result = validateFileName('file\x00name.md', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('INVALID_CHARS')
  })

  it('先頭スペースの名前を拒否する', () => {
    const result = validateFileName(' file.md', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('INVALID_CHARS')
  })

  it('末尾スペースの名前を拒否する', () => {
    const result = validateFileName('file.md ', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('INVALID_CHARS')
  })

  it('先頭ドットの名前を拒否する', () => {
    const result = validateFileName('.hidden', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('INVALID_CHARS')
  })

  it('末尾ドットの名前を拒否する', () => {
    const result = validateFileName('file.', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('INVALID_CHARS')
  })

  it.each(['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'])(
    'Windowsの予約名「%s」を拒否する',
    (name) => {
      const result = validateFileName(name, parentPath)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('RESERVED_NAME')
    },
  )

  it('予約名に拡張子がついた場合も拒否する', () => {
    const result = validateFileName('CON.txt', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('RESERVED_NAME')
  })

  it('予約名の大文字小文字を区別しない', () => {
    const result = validateFileName('con.md', parentPath)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('RESERVED_NAME')
  })

  it('パス全体が260文字を超える場合を拒否する', () => {
    const longParent = '/workspace/' + 'a'.repeat(250)
    const result = validateFileName('file.md', longParent)
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('PATH_TOO_LONG')
  })

  it('日本語ファイル名を許可する', () => {
    const result = validateFileName('ドキュメント.md', parentPath)
    expect(result.isValid).toBe(true)
  })
})

describe('generateUniqueName', () => {
  it('重複がなければそのまま返す', () => {
    const result = generateUniqueName('file.md', new Set(['other.md']))
    expect(result).toBe('file.md')
  })

  it('重複がある場合は(1)を付与する', () => {
    const result = generateUniqueName('file.md', new Set(['file.md']))
    expect(result).toBe('file(1).md')
  })

  it('連番で重複回避する', () => {
    const existing = new Set(['file.md', 'file(1).md', 'file(2).md'])
    const result = generateUniqueName('file.md', existing)
    expect(result).toBe('file(3).md')
  })

  it('拡張子なしのファイルにも対応する', () => {
    const result = generateUniqueName('README', new Set(['README']))
    expect(result).toBe('README(1)')
  })

  it('最大99までの連番を試行する', () => {
    const existing = new Set<string>()
    for (let i = 0; i <= 98; i++) {
      existing.add(i === 0 ? 'file.md' : `file(${i}).md`)
    }
    const result = generateUniqueName('file.md', existing)
    expect(result).toBe('file(99).md')
  })
})

describe('getFileType', () => {
  it('.mdファイルをmarkdownと判定する', () => {
    expect(getFileType('document.md')).toBe('markdown')
  })

  it('.mdxファイルをmarkdownと判定する', () => {
    expect(getFileType('component.mdx')).toBe('markdown')
  })

  it('.txtファイルをplaintextと判定する', () => {
    expect(getFileType('notes.txt')).toBe('plaintext')
  })

  it('拡張子なしをplaintextと判定する', () => {
    expect(getFileType('README')).toBe('plaintext')
  })
})

describe('containsNullByte', () => {
  it('NULLバイトを含むデータを検出する', () => {
    const data = new Uint8Array([0x48, 0x00, 0x65])
    expect(containsNullByte(data)).toBe(true)
  })

  it('NULLバイトを含まないデータはfalseを返す', () => {
    const data = new Uint8Array([0x48, 0x65, 0x6c])
    expect(containsNullByte(data)).toBe(false)
  })

  it('空のデータはfalseを返す', () => {
    const data = new Uint8Array([])
    expect(containsNullByte(data)).toBe(false)
  })
})
