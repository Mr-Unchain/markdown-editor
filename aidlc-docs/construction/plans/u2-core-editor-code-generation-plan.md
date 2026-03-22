# U2: Core Editor — コード生成プラン

## ユニット情報
- **ユニット**: U2 Core Editor
- **MVPストーリー**: US-01〜US-08（8ストーリー）
- **依存ユニット**: U1 Foundation（完了済み）
- **コード配置**: `markdown-editor/src/` 配下

## context7検証方針
各ステップでTiptap, Svelte 5, lowlight等の最新APIをcontext7で検証してから実装。

---

## ステップ一覧

### Step 1: パッケージインストール
- [x] Tiptap関連パッケージ（@tiptap/core, @tiptap/pm, @tiptap/starter-kit, 13エクステンション）をdependenciesに追加
- [x] lowlight, tippy.js をdependenciesに追加
- [x] katex, mermaid を dependencies に追加（遅延ロード対象）
- [x] `pnpm install` で依存解決
- [x] context7: Tiptap 3.x（2.xから3.xにメジャーバージョンアップ済み）, lowlight 3.x, tippy.js の最新インストール手順を確認

### Step 2: エディター型定義
- [x] `src/lib/types/editor.ts` — EditorOptions, EditorState, ActiveFormats, FormatCommand, TableCommand, CommandResult
- [x] `src/lib/types/slash-command.ts` — SlashCommandItem, SlashCommandState
- [x] `src/lib/types/link-editor.ts` — LinkEditorState
- [x] `src/lib/types/plugin.ts` — PluginManifest, PluginInstance, BundledPluginId
- [x] `src/lib/types/code-block.ts` — CodeBlockAttrs, SUPPORTED_LANGUAGES, KeyboardShortcut
- **ストーリー**: US-01〜US-08 共通型基盤

### Step 3: Tiptapエクステンション設定
- [x] `src/lib/extensions/code-block-lowlight.ts` — lowlight初期化 + 16言語個別インポート + CodeBlockLowlight設定
- [x] `src/lib/extensions/slash-command-extension.ts` — @tiptap/suggestion ベースのカスタムエクステンション + tippy.js連携
- [x] `src/lib/extensions/link-extension.ts` — Link拡張カスタム設定（autolink, openOnClick: false）
- [x] `src/lib/extensions/table-extension.ts` — Table + TableRow + TableCell + TableHeader バンドル設定
- [x] context7: Tiptap CodeBlockLowlight, Suggestion, Link, Table APIを検証
- **ストーリー**: US-04（コードブロック）, US-06（スラッシュコマンド）, US-05（リンク）, US-03（テーブル）

### Step 4: EditorCore（エディターコア）
- [x] `src/lib/core/editor/editor-core.ts` — EditorCore クラス: initialize(), destroy(), setContent(), getMarkdown(), getEditorState()
- [x] `src/lib/core/editor/extension-registry.ts` — safeRegisterExtensions(), コア/オプショナル分類（R-U2-01）
- [x] `src/lib/core/editor/markdown-converter.ts` — Markdown ↔ ProseMirrorDoc 変換ヘルパー + 整合性保護（R-U2-02）
- [x] `src/lib/core/editor/slash-commands.ts` — スラッシュコマンド定義（静的配列12アイテム）+ フィルタロジック
- [x] context7: Tiptap Editor初期化、onUpdate/onTransaction/onSelectionUpdate コールバック、Svelte 5連携を検証
- **NFRパターン**: P-U2-02（デバウンス自動保存）, R-U2-01（エラー隔離）, R-U2-02（整合性保護）, P-U2-05（Markdown変換）
- **ストーリー**: US-01（リッチテキスト）, US-08（Undo/Redo）

### Step 5: EditorCoreテスト
- [x] `src/lib/core/editor/__tests__/editor-core.test.ts` — 初期化、コンテンツ設定/取得、自動保存デバウンス、破棄
- [x] `src/lib/core/editor/__tests__/extension-registry.test.ts` — safeRegisterExtensions: 正常/失敗/混合パターン
- [x] `src/lib/core/editor/__tests__/markdown-converter.test.ts` — 正常変換、空文字、null、エラーケース
- [x] `src/lib/core/editor/__tests__/slash-commands.test.ts` — コマンド定義、フィルタリング、エイリアス検索、大文字小文字

### Step 6: ユーティリティ
- [x] `src/lib/utils/link-validator.ts` — validateLinkUrl(): javascript/data/vbscript拒否、https自動補完（S-U2-02）
- [x] `src/lib/utils/keyboard-navigation.ts` — Roving Tabindex ヘルパー（A-U2-02）
- [x] `src/lib/utils/plugin-loader.ts` — loadPluginWithRetry(): 指数バックオフ3回リトライ（R-U2-03）

### Step 7: ユーティリティテスト
- [x] `src/lib/utils/__tests__/link-validator.test.ts` — 正常URL, javascript:, data:, プロトコル補完, 相対パス, ハッシュ
- [x] `src/lib/utils/__tests__/keyboard-navigation.test.ts` — フォーカス移動、ループ、tabindex更新
- [x] `src/lib/utils/__tests__/plugin-loader.test.ts` — 正常ロード、リトライ、最終失敗

### Step 8: Editorストア
- [x] `src/lib/stores/editor.svelte.ts` — editorState Store（$stateベース）、activeFormats, canUndo, canRedo
- [x] context7: Svelte 5 $state/$derived パターン検証

### Step 9: 同梱プラグイン（遅延ロード対象）
- [x] `src/lib/plugins/katex/index.ts` — KaTeXプラグインエントリ + マニフェスト
- [x] `src/lib/plugins/katex/katex-node-view.ts` — NodeView実装（P-U2-01）
- [x] `src/lib/plugins/mermaid/index.ts` — Mermaidプラグインエントリ + マニフェスト
- [x] `src/lib/plugins/mermaid/mermaid-node-view.ts` — NodeView実装
- [x] `src/lib/plugins/zenn/index.ts` — Zenn構文プラグインエントリ + マニフェスト
- [x] `src/lib/plugins/zenn/zenn-nodes.ts` — :::message, :::details カスタムノード
- [x] context7: KaTeX API, Mermaid API を検証
- **NFRパターン**: P-U2-01（遅延登録）, R-U2-03（リトライ）

### Step 10: UIコンポーネント — FixedToolbar系
- [x] `src/components/editor/FixedToolbar.svelte` — 固定ツールバー + ResizeObserver（RS-U2-01）
- [x] `src/components/editor/FormatButtonGroup.svelte` — 太字/斜体/取消線/コード
- [x] `src/components/editor/HeadingDropdown.svelte` — テキスト/H1/H2/H3 ドロップダウン
- [x] `src/components/editor/ListButtonGroup.svelte` — 箇条書き/番号付き/チェックリスト
- [x] `src/components/editor/InsertButtonGroup.svelte` — テーブル/コードブロック/引用/区切り線/リンク
- [x] `src/components/editor/UndoRedoButtons.svelte` — Undo/Redo
- [x] `src/components/editor/OverflowMenu.svelte` — オーバーフローメニュー
- [x] 全ボタンに `data-testid` 属性、`aria-pressed`、`aria-label`、Roving Tabindex（A-U2-01, A-U2-02）
- **ストーリー**: US-01（リッチテキスト）, US-07（キーボードショートカット）, US-08（Undo/Redo）

### Step 11: UIコンポーネント — エディター本体
- [x] `src/components/editor/EditorContainer.svelte` — Tiptapマウントポイント + role="textbox"（A-U2-01）
- [x] `src/components/editor/BubbleToolbar.svelte` — テキスト選択時バブルメニュー
- [x] `src/components/editor/AriaLiveRegion.svelte` — 書式変更スクリーンリーダー通知（A-U2-03）
- [x] context7: Tiptap BubbleMenu Svelte 5連携を検証
- **ストーリー**: US-01（リッチテキスト）

### Step 12: UIコンポーネント — スラッシュコマンド・リンク・テーブル・コードブロック
- [x] `src/components/editor/SlashCommandPalette.svelte` — コマンドパレット + $derived フィルタ（P-U2-04）
- [x] `src/components/editor/LinkPopover.svelte` — リンク作成/編集ポップオーバー + URL検証（S-U2-02）
- [x] `src/components/editor/TableControls.svelte` — テーブル操作コンテキストメニュー
- [x] `src/components/editor/CodeBlockWrapper.svelte` — コードブロックNodeView（言語選択+コピー）
- **ストーリー**: US-06（スラッシュコマンド）, US-05（リンク）, US-03（テーブル）, US-04（コードブロック）

### Step 13: EditorPage（統合ページ）
- [x] `src/routes/+page.svelte` を更新 — EditorCore初期化、全コンポーネント統合
- [x] EditorCore.initialize() → FixedToolbar + EditorContainer + BubbleToolbar + AriaLiveRegion
- [x] onMount/onDestroy ライフサイクル管理
- [x] キーボードショートカット登録（Ctrl+B, Ctrl+I, Ctrl+S 等）
- [x] context7: Svelte 5 onMount, $state, $derived 最新パターン検証
- **ストーリー**: US-07（キーボードショートカット）

### Step 14: UIコンポーネントテスト
- [x] `src/components/editor/__tests__/FixedToolbar.test.ts` — レンダリング、ボタンクリック、ARIA属性
- [x] `src/components/editor/__tests__/SlashCommandPalette.test.ts` — 表示/非表示、フィルタリング、キーボード操作
- [x] `src/components/editor/__tests__/LinkPopover.test.ts` — 作成モード、編集モード、URL検証
- [x] `src/components/editor/__tests__/CodeBlockWrapper.test.ts` — 言語選択、コピーボタン
- [x] `src/components/editor/__tests__/TableControls.test.ts` — 行列操作ボタン

### Step 15: エディターCSSスタイル
- [x] `src/components/editor/editor.css` — Tiptapエディター基本スタイル、ProseMirrorデフォルト上書き
- [x] ツールバーCSS、バブルメニューCSS、スラッシュコマンドCSS
- [x] コードブロックCSS（highlight.jsテーマ互換）、テーブルCSS
- [x] プレースホルダースタイル、フォーカスリングスタイル
- [x] コントラスト比 7:1 以上（AAA基準）
- **NFRパターン**: RS-U2-01（レスポンシブ）, A-U2-01（アクセシビリティ）

### Step 16: ドキュメントサマリー
- [x] `aidlc-docs/construction/u2-core-editor/code/code-generation-summary.md` — 生成ファイル一覧、ストーリートレーサビリティ、NFRパターン適用状況

---

## ストーリートレーサビリティ

| ストーリー | 関連ステップ |
|---|---|
| US-01: リッチテキスト編集 | Step 2, 4, 10, 11, 13, 15 |
| US-02: リスト・チェックリスト | Step 3(table-extension), 4, 10 |
| US-03: テーブル編集 | Step 2, 3, 4, 12, 14 |
| US-04: コードブロック編集 | Step 2, 3, 4, 12, 14, 15 |
| US-05: 引用・区切り線・リンク | Step 2, 3, 6, 12, 14 |
| US-06: スラッシュコマンド | Step 2, 3, 4, 12, 14 |
| US-07: キーボードショートカット | Step 2, 10, 13 |
| US-08: Undo/Redo | Step 4, 10, 13 |

## NFRパターントレーサビリティ

| パターン | 関連ステップ |
|---|---|
| P-U2-01: エクステンション遅延登録 | Step 9 |
| P-U2-02: デバウンス自動保存 | Step 4 |
| P-U2-03: シンタックスハイライト最適化 | Step 3 |
| P-U2-04: スラッシュコマンド高速フィルタリング | Step 12 |
| P-U2-05: Markdown変換バッファリング | Step 4 |
| R-U2-01: エクステンションエラー隔離 | Step 4 |
| R-U2-02: ドキュメント整合性保護 | Step 4 |
| R-U2-03: プラグイン遅延ロードリトライ | Step 6 |
| A-U2-01: WAI-ARIA ロールマッピング | Step 10, 11, 12 |
| A-U2-02: キーボードナビゲーション | Step 6, 10 |
| A-U2-03: ライブリージョン通知 | Step 11 |
| S-U2-01: ペーストサニタイズ | Step 4 (Tiptapスキーマ依存) |
| S-U2-02: リンクURLバリデーション | Step 6, 12 |
| RS-U2-01: ツールバーオーバーフロー管理 | Step 10 |

## 生成ファイル数見積
- 型定義: 5ファイル
- エクステンション設定: 4ファイル
- エディターコア: 4ファイル
- ユーティリティ: 3ファイル
- ストア: 1ファイル
- プラグイン: 6ファイル
- UIコンポーネント: 15ファイル
- CSSスタイル: 1ファイル
- テスト: 12ファイル
- ドキュメント: 1ファイル
- **合計: 約52ファイル**
