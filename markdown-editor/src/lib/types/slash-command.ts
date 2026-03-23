import type { Editor } from '@tiptap/core'
import type { Range } from '@tiptap/suggestion'

/** スラッシュコマンドアイテム */
export interface SlashCommandItem {
  /** コマンド識別子 */
  id: string
  /** 表示名 */
  title: string
  /** 説明テキスト */
  description: string
  /** アイコン文字 */
  icon: string
  /** 検索用エイリアス */
  aliases: string[]
  /** グループ名（カテゴリ） */
  group: 'テキスト' | 'リスト' | 'メディア' | '挿入' | 'プラットフォーム'
  /** 実行関数 */
  action: (editor: Editor, range: Range) => void
}

/** スラッシュコマンドの状態 */
export interface SlashCommandState {
  /** 表示中か */
  isOpen: boolean
  /** フィルタークエリ */
  query: string
  /** フィルタ後のアイテム */
  items: SlashCommandItem[]
  /** 選択中のインデックス */
  selectedIndex: number
}
