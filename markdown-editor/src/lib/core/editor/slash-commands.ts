import type { SlashCommandItem } from '$lib/types/slash-command'

/** スラッシュコマンド定義（静的配列12アイテム） */
export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'paragraph',
    title: 'テキスト',
    description: '通常のテキスト段落',
    icon: '¶',
    aliases: ['text', 'p'],
    group: 'テキスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    id: 'heading1',
    title: '見出し1',
    description: '大きな見出し',
    icon: 'H1',
    aliases: ['h1', 'heading'],
    group: 'テキスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    id: 'heading2',
    title: '見出し2',
    description: '中サイズの見出し',
    icon: 'H2',
    aliases: ['h2'],
    group: 'テキスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    id: 'heading3',
    title: '見出し3',
    description: '小さな見出し',
    icon: 'H3',
    aliases: ['h3'],
    group: 'テキスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    id: 'bulletList',
    title: '箇条書きリスト',
    description: '箇条書きの項目リスト',
    icon: '•',
    aliases: ['ul', 'bullet', 'list'],
    group: 'リスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    id: 'orderedList',
    title: '番号付きリスト',
    description: '番号付きの項目リスト',
    icon: '1.',
    aliases: ['ol', 'number', 'numbered'],
    group: 'リスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    id: 'taskList',
    title: 'チェックリスト',
    description: 'チェックボックス付きリスト',
    icon: '☐',
    aliases: ['todo', 'task', 'check', 'checkbox'],
    group: 'リスト',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    id: 'codeBlock',
    title: 'コードブロック',
    description: 'シンタックスハイライト付きコードブロック',
    icon: '</>',
    aliases: ['code', 'pre', 'snippet'],
    group: 'メディア',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    id: 'table',
    title: 'テーブル',
    description: '3×3のテーブルを挿入',
    icon: '⊞',
    aliases: ['table', 'grid'],
    group: 'メディア',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    id: 'blockquote',
    title: '引用',
    description: '引用ブロック',
    icon: '"',
    aliases: ['quote', 'blockquote'],
    group: '挿入',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    id: 'horizontalRule',
    title: '区切り線',
    description: '水平区切り線',
    icon: '—',
    aliases: ['hr', 'divider', 'line', 'separator'],
    group: '挿入',
    action: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    id: 'image',
    title: '画像',
    description: '画像を挿入（U4で実装）',
    icon: '🖼',
    aliases: ['img', 'picture', 'photo'],
    group: '挿入',
    action: (_editor, _range) => {
      // U4で実装予定 — プレースホルダー
    },
  },
]

/**
 * スラッシュコマンドをフィルタリング（P-U2-04: 高速フィルタリング）
 * 前方一致 + エイリアス検索、大文字小文字区別なし
 */
export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  if (!query) return items

  const lowerQuery = query.toLowerCase()
  return items.filter((item) => {
    if (item.title.toLowerCase().startsWith(lowerQuery)) return true
    if (item.id.toLowerCase().startsWith(lowerQuery)) return true
    return item.aliases.some((alias) => alias.toLowerCase().startsWith(lowerQuery))
  })
}
