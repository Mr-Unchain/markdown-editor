# U2: Core Editor — ドメインエンティティ

## 1. EditorCore 関連型

```typescript
/** エディター初期化オプション */
interface EditorOptions {
  /** 初期コンテンツ（Markdown文字列） */
  content?: string
  /** コンテンツの形式 */
  contentType?: 'markdown' | 'html'
  /** 読み取り専用モード */
  editable?: boolean
  /** 追加エクステンション（プラグイン由来） */
  extensions?: TiptapExtension[]
  /** プレースホルダーテキスト */
  placeholder?: string
}

/** エディターの状態（UIバインディング用） */
interface EditorState {
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
interface ActiveFormats {
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
```

## 2. エディターコマンド型

```typescript
/** 書式コマンドの種別 */
type FormatCommand =
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
  | { type: 'insertImage'; src: string; alt?: string }
  | { type: 'undo' }
  | { type: 'redo' }

/** テーブル操作コマンド */
type TableCommand =
  | { type: 'addRowBefore' }
  | { type: 'addRowAfter' }
  | { type: 'deleteRow' }
  | { type: 'addColumnBefore' }
  | { type: 'addColumnAfter' }
  | { type: 'deleteColumn' }
  | { type: 'deleteTable' }
  | { type: 'setCellAttribute'; name: string; value: string }

/** コマンド実行結果 */
type CommandResult = boolean
```

## 3. スラッシュコマンド型

```typescript
/** スラッシュコマンドアイテム */
interface SlashCommandItem {
  /** コマンド識別子 */
  id: string
  /** 表示名 */
  title: string
  /** 説明テキスト */
  description: string
  /** アイコン識別子 */
  icon: string
  /** 検索用エイリアス */
  aliases: string[]
  /** グループ名（カテゴリ） */
  group: 'テキスト' | 'リスト' | 'メディア' | '挿入'
  /** 実行関数 */
  action: (editor: Editor, range: Range) => void
}

/** スラッシュコマンドの状態 */
interface SlashCommandState {
  /** 表示中か */
  isOpen: boolean
  /** フィルタークエリ */
  query: string
  /** フィルタ後のアイテム */
  items: SlashCommandItem[]
  /** 選択中のインデックス */
  selectedIndex: number
  /** ポップアップ位置 */
  position: { top: number; left: number } | null
}
```

## 4. リンク編集型

```typescript
/** リンクポップオーバーの状態 */
interface LinkEditorState {
  /** 表示中か */
  isOpen: boolean
  /** 編集中のURL */
  url: string
  /** 表示テキスト */
  text: string
  /** 新規タブで開くか */
  openInNewTab: boolean
  /** 編集モードか（既存リンクの編集） vs 新規作成 */
  mode: 'create' | 'edit'
  /** ポップオーバー位置 */
  position: { top: number; left: number } | null
}
```

## 5. PluginSystem 関連型

```typescript
/** プラグインマニフェスト */
interface PluginManifest {
  /** 一意識別子（例: 'katex', 'mermaid', 'zenn-syntax'） */
  id: string
  /** 表示名 */
  name: string
  /** バージョン */
  version: string
  /** 説明 */
  description: string
  /** プラグイン種別 */
  type: 'editor-extension' | 'platform-syntax' | 'export-transformer'
  /** エントリーポイント（遅延ロード用パス） */
  entryPoint: string
}

/** プラグインインスタンス（ロード後） */
interface PluginInstance {
  /** マニフェスト */
  manifest: PluginManifest
  /** Tiptapエクステンション（editor-extension 型のみ） */
  extensions?: TiptapExtension[]
  /** エクスポートトランスフォーマー（export-transformer 型のみ） */
  transformer?: ExportTransformer
  /** クリーンアップ関数 */
  destroy?: () => void
}

/** プラグイン設定（SettingsManager内） */
interface PluginConfig {
  /** プラグインID → 有効/無効 */
  enabled: Record<string, boolean>
}

/** 同梱プラグインの種別 */
type BundledPluginId = 'katex' | 'mermaid' | 'zenn-syntax'
```

## 6. コードブロック型

```typescript
/** コードブロックのattrs */
interface CodeBlockAttrs {
  /** プログラミング言語 */
  language: string
}

/** サポート言語一覧 */
const SUPPORTED_LANGUAGES = [
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
```

## 7. キーボードショートカット型

```typescript
/** ショートカット定義 */
interface KeyboardShortcut {
  /** キーの組み合わせ（Mod = Ctrl/Cmd） */
  keys: string
  /** 表示ラベル */
  label: string
  /** 実行するコマンド */
  command: FormatCommand
  /** カテゴリ */
  category: 'formatting' | 'editing' | 'navigation'
}

/** デフォルトショートカット一覧 */
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Mod-b',       label: '太字',         command: { type: 'toggleBold' },        category: 'formatting' },
  { keys: 'Mod-i',       label: '斜体',         command: { type: 'toggleItalic' },      category: 'formatting' },
  { keys: 'Mod-Shift-x', label: '取り消し線',    command: { type: 'toggleStrike' },      category: 'formatting' },
  { keys: 'Mod-e',       label: 'インラインコード', command: { type: 'toggleCode' },     category: 'formatting' },
  { keys: 'Mod-s',       label: '保存',          command: { type: 'save' },              category: 'editing' },
  { keys: 'Mod-z',       label: '元に戻す',      command: { type: 'undo' },              category: 'editing' },
  { keys: 'Mod-Shift-z', label: 'やり直し',      command: { type: 'redo' },              category: 'editing' },
]
```
