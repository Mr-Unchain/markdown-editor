import { describe, it, expect } from 'vitest'
import { SLASH_COMMAND_ITEMS, filterSlashCommands } from '../slash-commands'

describe('SLASH_COMMAND_ITEMS', () => {
  it('14個のコマンドが定義されている', () => {
    expect(SLASH_COMMAND_ITEMS).toHaveLength(14)
  })

  it('全アイテムにid, title, group, aliasesが存在する', () => {
    for (const item of SLASH_COMMAND_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.group).toBeTruthy()
      expect(Array.isArray(item.aliases)).toBe(true)
    }
  })

  it('IDが一意である', () => {
    const ids = SLASH_COMMAND_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('filterSlashCommands', () => {
  it('空クエリで全アイテムを返す', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, '')
    expect(result).toHaveLength(SLASH_COMMAND_ITEMS.length)
  })

  it('タイトルの前方一致でフィルタする', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, '見出し')
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result.every((item) => item.title.startsWith('見出し'))).toBe(true)
  })

  it('IDの前方一致でフィルタする', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, 'heading')
    expect(result.length).toBeGreaterThanOrEqual(3)
  })

  it('エイリアスでフィルタする', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, 'h1')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].id).toBe('heading1')
  })

  it('大文字小文字を区別しない', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, 'H1')
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('マッチなしで空配列を返す', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, 'zzzzz')
    expect(result).toHaveLength(0)
  })

  it('todoエイリアスでチェックリストがマッチする', () => {
    const result = filterSlashCommands(SLASH_COMMAND_ITEMS, 'todo')
    expect(result.some((item) => item.id === 'taskList')).toBe(true)
  })
})
