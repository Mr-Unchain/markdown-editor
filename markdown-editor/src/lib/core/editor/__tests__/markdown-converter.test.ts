import { describe, it, expect, vi } from 'vitest'
import { getMarkdownFromEditor, setMarkdownToEditor } from '../markdown-converter'

function createMockEditor(overrides: Record<string, any> = {}) {
  return {
    isEmpty: false,
    storage: {
      markdown: {
        getMarkdown: vi.fn(() => '# Hello\n\nWorld'),
      },
    },
    commands: {
      setContent: vi.fn(),
    },
    ...overrides,
  } as any
}

describe('getMarkdownFromEditor', () => {
  it('正常にMarkdownを取得する', () => {
    const editor = createMockEditor()
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(true)
    expect(result.data).toBe('# Hello\n\nWorld')
  })

  it('空ドキュメントで空文字を返す（正常）', () => {
    const editor = createMockEditor({
      isEmpty: true,
      storage: {
        markdown: {
          getMarkdown: vi.fn(() => ''),
        },
      },
    })
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(true)
  })

  it('ドキュメントが空でないのにMarkdownが空 → エラー', () => {
    const editor = createMockEditor({
      isEmpty: false,
      storage: {
        markdown: {
          getMarkdown: vi.fn(() => ''),
        },
      },
    })
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Markdown変換に失敗')
  })

  it('getMarkdownがnullを返す → エラー', () => {
    const editor = createMockEditor({
      storage: {
        markdown: {
          getMarkdown: vi.fn(() => null),
        },
      },
    })
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(false)
  })

  it('例外発生時にエラーを返す', () => {
    const editor = createMockEditor({
      storage: {
        markdown: {
          getMarkdown: vi.fn(() => {
            throw new Error('Conversion failed')
          }),
        },
      },
    })
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Conversion failed')
  })

  it('markdown storageが存在しない場合にエラーを返す', () => {
    const editor = createMockEditor({
      storage: {},
    })
    const result = getMarkdownFromEditor(editor)

    expect(result.ok).toBe(false)
  })
})

describe('setMarkdownToEditor', () => {
  it('正常にコンテンツを設定する', () => {
    const editor = createMockEditor()
    const result = setMarkdownToEditor(editor, '# Test')

    expect(result.ok).toBe(true)
    expect(editor.commands.setContent).toHaveBeenCalledWith('# Test', false)
  })

  it('setContent失敗時に空ドキュメントにフォールバックする', () => {
    const editor = createMockEditor({
      commands: {
        setContent: vi.fn().mockImplementationOnce(() => {
          throw new Error('Parse error')
        }),
      },
    })
    const result = setMarkdownToEditor(editor, 'invalid')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Parse error')
    // 2回目の呼び出し（フォールバック）
    expect(editor.commands.setContent).toHaveBeenCalledTimes(2)
  })
})
