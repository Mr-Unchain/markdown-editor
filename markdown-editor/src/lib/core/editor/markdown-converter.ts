import type { Editor } from '@tiptap/core'

export interface ConversionResult {
  ok: boolean
  data?: string
  error?: string
}

/**
 * ProseMirrorDoc → Markdown 変換（R-U2-02: 整合性保護）
 */
export function getMarkdownFromEditor(editor: Editor): ConversionResult {
  try {
    const markdown = editor.storage.markdown?.getMarkdown?.()
    if (markdown == null || (typeof markdown === 'string' && markdown.length === 0 && !editor.isEmpty)) {
      // ドキュメントが空でないのにMarkdownが空 → 変換異常
      return {
        ok: false,
        error: 'Markdown変換に失敗しました。ドキュメントは保全されています。',
      }
    }
    return { ok: true, data: markdown }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Markdown変換中に予期しないエラーが発生しました',
    }
  }
}

/**
 * Markdown → ProseMirrorDoc 変換（R-U2-02: 整合性保護）
 */
export function setMarkdownToEditor(editor: Editor, markdown: string): ConversionResult {
  try {
    editor.commands.setContent(markdown, false)
    return { ok: true }
  } catch (e) {
    // 失敗時は空ドキュメントで初期化
    try {
      editor.commands.setContent('<p></p>', false)
    } catch {
      // 最終フォールバック: 何もしない
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'ファイルの読み込みに失敗しました',
    }
  }
}
