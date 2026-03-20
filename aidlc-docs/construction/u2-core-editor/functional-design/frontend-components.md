# U2: Core Editor — フロントエンドコンポーネント設計

## コンポーネント階層

```
+page.svelte
  └── EditorPage
        ├── FixedToolbar              # 固定ツールバー（エディター上部）
        │     ├── FormatButtonGroup    # 太字/斜体/取消線/コード
        │     ├── HeadingDropdown      # 見出しレベル選択
        │     ├── ListButtonGroup      # リスト種別切替
        │     ├── InsertButtonGroup    # テーブル/コードブロック/引用/区切り線/リンク
        │     └── UndoRedoButtons      # Undo/Redo
        ├── EditorContainer            # Tiptapエディターマウント
        │     ├── BubbleToolbar        # テキスト選択時バブルメニュー
        │     ├── SlashCommandPalette  # スラッシュコマンドパレット
        │     ├── LinkPopover          # リンク編集ポップオーバー
        │     ├── CodeBlockWrapper     # コードブロック（言語ドロップダウン付き）
        │     └── TableControls        # テーブル操作コンテキストメニュー
        └── (StatusBar は既存のUIShellから提供)
```

## 1. EditorPage

**ファイル**: `src/routes/+page.svelte`

**責務**: エディターページ全体の構成とEditorCore初期化

**状態** (Svelte 5 runes):
```typescript
let editorState = $state<EditorState>({
  editor: null,
  isEmpty: true,
  canUndo: false,
  canRedo: false,
  activeFormats: { /* 全false */ }
})
```

**ライフサイクル**:
- `onMount`: EditorCore初期化、イベントリスナー設定
- `onDestroy`: EditorCore破棄

**Props**: なし（ルートページ）

---

## 2. FixedToolbar

**ファイル**: `src/components/editor/FixedToolbar.svelte`

**責務**: 固定ツールバー。書式ボタン群を表示し、エディターコマンドを実行する。

**Props**:
```typescript
interface FixedToolbarProps {
  editor: Editor | null
  activeFormats: ActiveFormats
  canUndo: boolean
  canRedo: boolean
}
```

**子コンポーネント**:
- `FormatButtonGroup` — 太字(B), 斜体(I), 取消線(S), コード(</>)
- `HeadingDropdown` — テキスト/H1/H2/H3 ドロップダウン
- `ListButtonGroup` — 箇条書き/番号付き/チェックリスト
- `InsertButtonGroup` — テーブル/コードブロック/引用/区切り線/リンク
- `UndoRedoButtons` — Undo/Redo ボタン

**ユーザーインタラクション**:
- ボタンクリック → `editor.chain().focus().toggle*().run()`
- アクティブ状態は `activeFormats` プロップで判定してハイライト

---

## 3. BubbleToolbar

**ファイル**: `src/components/editor/BubbleToolbar.svelte`

**責務**: テキスト選択時に表示されるフローティングメニュー。インライン書式の適用。

**実装方式**: Tiptap `BubbleMenu` 拡張を使用（`@tiptap/extension-bubble-menu`）

**Props**:
```typescript
interface BubbleToolbarProps {
  editor: Editor
}
```

**表示条件**: テキストが選択されている場合のみ表示（Tiptap BubbleMenu がデフォルトで制御）

**ボタン**: 太字/斜体/取消線/コード/リンク

**非表示条件**:
- コードブロック内の選択
- テーブルヘッダーの全選択
- 画像ノードの選択

---

## 4. EditorContainer

**ファイル**: `src/components/editor/EditorContainer.svelte`

**責務**: Tiptapエディターインスタンスのマウントポイント。

**Props**:
```typescript
interface EditorContainerProps {
  editor: Editor | null
}
```

**テンプレート**:
```svelte
<div class="editor-container" bind:this={element}>
  <!-- Tiptap がここに ProseMirror DOM をレンダリング -->
</div>
```

**スタイル**:
- `max-width`: SettingsManager の `editor.editorWidth` 設定値
- `font-size`: SettingsManager の `editor.fontSize` 設定値
- プレースホルダー: 空ドキュメント時に「タイトルを入力...」表示

---

## 5. SlashCommandPalette

**ファイル**: `src/components/editor/SlashCommandPalette.svelte`

**責務**: `/` 入力時のコマンドパレット表示。コマンド選択でノードを挿入する。

**実装方式**: `@tiptap/suggestion` プラグインのrender関数からSvelteコンポーネントをマウント

**Props**:
```typescript
interface SlashCommandPaletteProps {
  items: SlashCommandItem[]
  selectedIndex: number
  onSelect: (item: SlashCommandItem) => void
}
```

**状態**:
```typescript
let query = $state('')
let filteredItems = $derived(filterItems(items, query))
```

**コマンド一覧**:
| ID | タイトル | アイコン | グループ | エイリアス |
|---|---|---|---|---|
| paragraph | テキスト | ¶ | テキスト | text, p |
| heading1 | 見出し1 | H1 | テキスト | h1 |
| heading2 | 見出し2 | H2 | テキスト | h2 |
| heading3 | 見出し3 | H3 | テキスト | h3 |
| bulletList | 箇条書きリスト | • | リスト | ul, bullet |
| orderedList | 番号付きリスト | 1. | リスト | ol, number |
| taskList | チェックリスト | ☐ | リスト | todo, task, check |
| codeBlock | コードブロック | </> | メディア | code, pre |
| table | テーブル | ⊞ | メディア | table |
| blockquote | 引用 | " | 挿入 | quote |
| horizontalRule | 区切り線 | — | 挿入 | hr, divider, line |
| image | 画像 | 🖼 | 挿入 | img, picture |

**UI仕様**:
- カーソル直下にドロップダウン（最大高さ 320px、スクロール可能）
- グループ名ヘッダー付き
- 選択中アイテムはハイライト
- キーボード操作: ↑↓ で移動、Enter で実行、Escape で閉じる

---

## 6. LinkPopover

**ファイル**: `src/components/editor/LinkPopover.svelte`

**責務**: リンクの作成・編集用インラインポップオーバー。

**Props**:
```typescript
interface LinkPopoverProps {
  editor: Editor
  state: LinkEditorState
  onSubmit: (url: string, openInNewTab: boolean) => void
  onRemove: () => void
  onClose: () => void
}
```

**表示モード**:
1. **プレビューモード** — 既存リンクホバー時: URLテキスト + 「編集」「削除」「外部で開く」ボタン
2. **編集モード** — URL入力フィールド + 「新規タブで開く」チェック + 「適用」ボタン

**バリデーション**:
- URLが空 → リンク解除
- `http://` / `https://` がない場合は `https://` を自動補完

---

## 7. CodeBlockWrapper

**ファイル**: `src/components/editor/CodeBlockWrapper.svelte`

**責務**: コードブロックの上部に言語選択ドロップダウンを表示する。

**実装方式**: Tiptap NodeView（`addNodeView`）としてSvelteコンポーネントをマウント

**Props**:
```typescript
interface CodeBlockWrapperProps {
  node: ProseMirrorNode
  updateAttributes: (attrs: Partial<CodeBlockAttrs>) => void
  editor: Editor
}
```

**UI**:
- 言語ドロップダウン（`SUPPORTED_LANGUAGES` リスト）
- コピーボタン（コードブロック内容をクリップボードへ）
- コードブロック本体（lowlightでハイライト済み）

---

## 8. TableControls

**ファイル**: `src/components/editor/TableControls.svelte`

**責務**: テーブル内のコンテキストメニュー。行/列の追加・削除操作。

**表示条件**: カーソルがテーブル内にある時（ツールバーにテーブル操作ボタンとして表示）

**Props**:
```typescript
interface TableControlsProps {
  editor: Editor
}
```

**操作ボタン**:
- 上に行を追加 / 下に行を追加
- 行を削除
- 左に列を追加 / 右に列を追加
- 列を削除
- セル揃え（左/中央/右）
- テーブルを削除

---

## 共通UIパターン

### ツールバーボタン
```svelte
<button
  class="toolbar-btn"
  class:active={isActive}
  disabled={!editor}
  onclick={handler}
  title={label}
  aria-pressed={isActive}
>
  <span class="toolbar-icon">{icon}</span>
</button>
```

### ドロップダウン
```svelte
<div class="dropdown" class:open={isOpen}>
  <button class="dropdown-trigger" onclick={toggle}>
    {selectedLabel} ▼
  </button>
  {#if isOpen}
    <div class="dropdown-menu">
      {#each options as option}
        <button
          class="dropdown-item"
          class:selected={option.id === selectedId}
          onclick={() => select(option)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
```

### ポップオーバー
- 位置: Tiptapの `posToDOMRect` でカーソル/選択位置を取得
- 画面外はみ出し防止: 上下左右のバウンダリーチェック
- Escape / 外部クリックで閉じる

## context7検証メモ

- **Svelte 5でのTiptap初期化**: `onMount` 内で `new Editor()` + `$state` でエディターインスタンス管理。`onTransaction` コールバックで `editorState = { editor }` として再レンダリングを誘発（context7 Svelte例に準拠）
- **BubbleMenu**: `@tiptap/extension-bubble-menu` を使用。`BubbleMenu.configure({ element: bubbleMenuElement })` でSvelteコンポーネントのDOM要素を渡す
- **CodeBlockLowlight**: `@tiptap/extension-code-block-lowlight` + `lowlight` ライブラリ。`languageClassPrefix: 'language-'` でhighlight.jsテーマCSS互換
- **Suggestion**: `@tiptap/suggestion` プラグインのrender関数でSvelteコンポーネントを動的マウント（tippy.jsでポジショニング）
- **Markdown拡張**: `@tiptap/markdown` + `markedOptions: { gfm: true }` でGFMパース。`editor.storage.markdown.getMarkdown()` で出力
