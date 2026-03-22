import type { Editor } from '@tiptap/core'

/** エディター初期化オプション */
export interface EditorOptions {
  /** 初期コンテンツ（Markdown文字列） */
  content?: string
  /** 読み取り専用モード */
  editable?: boolean
  /** プレースホルダーテキスト */
  placeholder?: string
}

/** エディターの状態（UIバインディング用） */
export interface EditorState {
  /** Tiptap Editor インスタンス */
  editor: Editor | null
  /** ドキュメントが空か */
  isEmpty: boolean
  /** Undo可能か */
  canUndo: boolean
  /** Redo可能か */
  canRedo: boolean
  /** 現在のアクティブマーク/ノード */
  activeFormats: ActiveFormats
}

/** アクティブな書式状態 */
export interface ActiveFormats {
  bold: boolean
  italic: boolean
  strike: boolean
  code: boolean
  heading: false | 1 | 2 | 3 | 4 | 5 | 6
  bulletList: boolean
  orderedList: boolean
  taskList: boolean
  blockquote: boolean
  codeBlock: boolean
  link: boolean
}

/** 書式コマンドの種別 */
export type FormatCommand =
  | { type: 'toggleBold' }
  | { type: 'toggleItalic' }
  | { type: 'toggleStrike' }
  | { type: 'toggleCode' }
  | { type: 'setHeading'; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'setParagraph' }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'toggleTaskList' }
  | { type: 'toggleBlockquote' }
  | { type: 'toggleCodeBlock'; language?: string }
  | { type: 'setHorizontalRule' }
  | { type: 'setLink'; href: string; target?: string }
  | { type: 'unsetLink' }
  | { type: 'insertTable'; rows: number; cols: number }
  | { type: 'undo' }
  | { type: 'redo' }

/** テーブル操作コマンド */
export type TableCommand =
  | { type: 'addRowBefore' }
  | { type: 'addRowAfter' }
  | { type: 'deleteRow' }
  | { type: 'addColumnBefore' }
  | { type: 'addColumnAfter' }
  | { type: 'deleteColumn' }
  | { type: 'deleteTable' }
  | { type: 'setCellAttribute'; name: string; value: string }

/** デフォルトのアクティブフォーマット */
export const DEFAULT_ACTIVE_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  strike: false,
  code: false,
  heading: false,
  bulletList: false,
  orderedList: false,
  taskList: false,
  blockquote: false,
  codeBlock: false,
  link: false,
}

/** デフォルトのエディターステート */
export const DEFAULT_EDITOR_STATE: EditorState = {
  editor: null,
  isEmpty: true,
  canUndo: false,
  canRedo: false,
  activeFormats: { ...DEFAULT_ACTIVE_FORMATS },
}
