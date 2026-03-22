/** コードブロックのattrs */
export interface CodeBlockAttrs {
  /** プログラミング言語 */
  language: string
}

/** サポート言語定義 */
export interface SupportedLanguage {
  id: string
  label: string
}

/** サポート言語一覧 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'shell', label: 'Shell' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'sql', label: 'SQL' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
] as const

/** キーボードショートカット定義 */
export interface KeyboardShortcut {
  /** キーの組み合わせ（Mod = Ctrl/Cmd） */
  keys: string
  /** 表示ラベル */
  label: string
  /** カテゴリ */
  category: 'formatting' | 'editing' | 'navigation'
}

/** デフォルトショートカット一覧 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Mod-b', label: '太字', category: 'formatting' },
  { keys: 'Mod-i', label: '斜体', category: 'formatting' },
  { keys: 'Mod-Shift-x', label: '取り消し線', category: 'formatting' },
  { keys: 'Mod-e', label: 'インラインコード', category: 'formatting' },
  { keys: 'Mod-s', label: '保存', category: 'editing' },
  { keys: 'Mod-z', label: '元に戻す', category: 'editing' },
  { keys: 'Mod-Shift-z', label: 'やり直し', category: 'editing' },
]
