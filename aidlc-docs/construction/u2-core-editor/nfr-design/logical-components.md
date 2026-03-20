# U2: Core Editor — 論理コンポーネント配置図

## コンポーネント構成

### レイヤー構成と配置

```
+====================================================================+
|                     Presentation Layer (U2)                         |
|                                                                     |
|  +--------------------------------------------------------------+   |
|  | EditorPage (+page.svelte)                                     |   |
|  |   ├── FixedToolbar           role="toolbar"                   |   |
|  |   │     ├── FormatButtonGroup   (B/I/S/Code)                  |   |
|  |   │     ├── HeadingDropdown     (Text/H1/H2/H3)              |   |
|  |   │     ├── ListButtonGroup     (Bullet/Ordered/Task)         |   |
|  |   │     ├── InsertButtonGroup   (Table/Code/Quote/HR/Link)    |   |
|  |   │     ├── UndoRedoButtons     (Undo/Redo)                   |   |
|  |   │     └── OverflowMenu        (幅不足時の収納先)            |   |
|  |   ├── EditorContainer        role="textbox"                   |   |
|  |   │     ├── BubbleToolbar    role="toolbar"  (選択時のみ)     |   |
|  |   │     ├── SlashCommandPalette role="listbox" ('/'入力時)    |   |
|  |   │     ├── LinkPopover      role="dialog"   (リンク操作時)   |   |
|  |   │     ├── CodeBlockWrapper (NodeView, 言語選択+コピー)      |   |
|  |   │     └── TableControls    role="menu"     (テーブル内)     |   |
|  |   └── AriaLiveRegion         role="status"   (書式通知)       |   |
|  +--------------------------------------------------------------+   |
+====================================================================+
         |                              |
         | $state / $derived            | editor.chain()...run()
         v                              v
+====================================================================+
|                       Editor Core Layer (U2)                        |
|                                                                     |
|  +--------------------------------------------------------------+   |
|  | EditorCore                                                    |   |
|  |   - initialize(container, options): void                      |   |
|  |   - destroy(): void                                           |   |
|  |   - setContent(markdown): void                                |   |
|  |   - getMarkdown(): string                                     |   |
|  |   - getEditorState(): EditorState                             |   |
|  |   - onUpdate callback → autoSave (debounce 1000ms)           |   |
|  +--------------------------------------------------------------+   |
|  +--------------------------------------------------------------+   |
|  | Tiptap Editor Instance                                        |   |
|  |   ├── StarterKit (Heading,Bold,Italic,Strike,List,Quote...)   |   |
|  |   ├── Table + TableRow + TableCell + TableHeader              |   |
|  |   ├── TaskList + TaskItem                                     |   |
|  |   ├── CodeBlockLowlight (lowlight + 16言語)                   |   |
|  |   ├── Link (autolink: true)                                   |   |
|  |   ├── Placeholder                                             |   |
|  |   ├── TextAlign                                               |   |
|  |   ├── BubbleMenu                                              |   |
|  |   ├── Markdown (GFM: true)                                    |   |
|  |   └── SlashCommand (suggestion)                               |   |
|  +--------------------------------------------------------------+   |
|  +--------------------------------------------------------------+   |
|  | PluginSystem (U1定義、U2で拡張利用)                           |   |
|  |   ├── [遅延] KaTeX Plugin      ($ / $$ トリガー)              |   |
|  |   ├── [遅延] Mermaid Plugin    (```mermaid トリガー)          |   |
|  |   └── [遅延] Zenn Syntax Plugin (::: トリガー)                |   |
|  +--------------------------------------------------------------+   |
+====================================================================+
         |                              |
         | FileManager.saveFile()       | SettingsManager.get()
         | FileManager.openFile()       |
         v                              v
+====================================================================+
|            Service Layer (U1 提供 — U2から参照)                     |
|                                                                     |
|  +----------------------------+  +----------------------------+     |
|  | FileManager (U3で実装)     |  | SettingsManager (U1)       |     |
|  | ※U2はインターフェースのみ  |  | - editorWidth, fontSize    |     |
|  |   依存（型定義で参照）     |  | - theme, autoSave設定      |     |
|  +----------------------------+  +----------------------------+     |
+====================================================================+
         |                              |
         v                              v
+====================================================================+
|          Infrastructure Layer (U1 提供)                              |
|  FileSystemAdapter, SecureStorage (変更なし)                         |
+====================================================================+
```

## エディター初期化シーケンス

```
[EditorPage マウント]
    |
    v
(1) EditorCore.initialize(container, options)          < 200ms目標
    |
    +-- (1a) エクステンション分類                       < 5ms
    |     コア: StarterKit + Document + Paragraph + Text
    |     オプショナル: Table, CodeBlockLowlight, Link 等
    |
    +-- (1b) safeRegisterExtensions()                  < 100ms
    |     コア → 必ず登録（失敗=起動中止）
    |     オプショナル → try-catch で隔離（R-U2-01）
    |     失敗リスト → notify('warning', ...)
    |
    +-- (1c) new Editor({ extensions, content })        < 50ms
    |     onUpdate → デバウンス自動保存（P-U2-02）
    |     onSelectionChange → activeFormats更新
    |     onTransaction → editorState更新
    |
    +-- (1d) 初回レンダリング                           < 50ms
    |
    v
(2) FixedToolbar マウント                               < 10ms
    → editor インスタンス参照
    → ResizeObserver でオーバーフロー監視（RS-U2-01）
    |
    v
(3) BubbleMenu 設定                                     < 5ms
    → BubbleMenu拡張が自動制御
    |
    v
(4) [初期化完了] ユーザー操作可能                       合計 < 200ms
    |
    v
(5) [バックグラウンド] 同梱プラグインのプリスキャン
    → ドキュメント内容を検査し、必要なプラグインを特定
    → 該当プラグインを動的importで遅延ロード（P-U2-01）
```

## ドキュメント操作データフロー

### 編集→自動保存フロー

```
[ユーザー入力]
    |
    v
Tiptap onUpdate({ editor })
    |
    +-- (即時) editorState 更新 → UI再レンダリング
    |     activeFormats, canUndo, canRedo
    |
    +-- (即時) saveStatus.set('unsaved')
    |
    +-- (1000ms後) autoSave() [P-U2-02: デバウンス]
          |
          +-- getMarkdown() [P-U2-05: ~80ms for 200KB]
          |
          +-- markdown が null/空? [R-U2-02: 整合性保護]
          |     → Yes: ProseMirrorDoc JSONで緊急保存
          |     → No: FileManager.saveFile(path, markdown)
          |
          +-- 保存成功 → saveStatus.set('saved')
          +-- 保存失敗 → saveStatus.set('error'), notify('error', ...)
```

### ファイル読み込みフロー

```
[FileManager.openFile(path)]
    |
    v
Markdown文字列取得
    |
    v
editor.commands.setContent(markdown, { emitUpdate: false })
    |                                    ^-- 自動保存トリガー防止
    +-- 正常 → エディター表示
    +-- 例外 → 空ドキュメントで初期化 [R-U2-02]
              → notify('error', 'ファイルの読み込みに失敗しました')
```

## NFRパターンとコンポーネントの対応表

| パターン | 適用コンポーネント | NFR要件 |
|---|---|---|
| P-U2-01: エクステンション遅延登録 | PluginSystem, KaTeX/Mermaid/Zenn | NFR-U2-02 |
| P-U2-02: デバウンス自動保存 | EditorCore | NFR-U2-08 |
| P-U2-03: シンタックスハイライト最適化 | CodeBlockLowlight, CodeBlockWrapper | NFR-U2-05 |
| P-U2-04: スラッシュコマンド高速フィルタリング | SlashCommandPalette | NFR-U2-04 |
| P-U2-05: Markdown変換バッファリング | EditorCore (@tiptap/markdown) | NFR-U2-06 |
| R-U2-01: エクステンションエラー隔離 | EditorCore 初期化 | NFR-U2-07 |
| R-U2-02: ドキュメント整合性保護 | EditorCore 保存/読み込み | NFR-U2-08 |
| R-U2-03: プラグイン遅延ロードリトライ | PluginSystem | NFR-U2-09 |
| A-U2-01: WAI-ARIA ロールマッピング | 全UIコンポーネント | NFR-U2-10 |
| A-U2-02: キーボードナビゲーション | FixedToolbar, SlashCommandPalette | NFR-U2-11 |
| A-U2-03: ライブリージョン通知 | AriaLiveRegion | NFR-U2-10 |
| S-U2-01: ペーストサニタイズ | EditorCore (Tiptapスキーマ) | NFR-U2-15 |
| S-U2-02: リンクURLバリデーション | LinkPopover | NFR-U2-15 |
| RS-U2-01: ツールバーオーバーフロー管理 | FixedToolbar | NFR-U2-12 |

## ファイル配置計画

```
markdown-editor/src/lib/
├── core/
│   └── editor/
│       ├── editor-core.ts              # EditorCore クラス（初期化、自動保存、状態管理）
│       ├── editor-types.ts             # EditorState, ActiveFormats, SlashCommandItem 型定義
│       ├── extension-registry.ts       # safeRegisterExtensions(), エクステンション分類
│       ├── markdown-converter.ts       # Markdown ↔ ProseMirrorDoc 変換ヘルパー
│       └── slash-commands.ts           # スラッシュコマンド定義（静的配列）+ suggestion設定
├── extensions/
│   ├── code-block-lowlight.ts          # CodeBlockLowlight設定 + lowlight言語登録
│   ├── slash-command-extension.ts      # @tiptap/suggestion ベースのカスタムエクステンション
│   ├── link-extension.ts              # Link拡張のカスタム設定
│   └── table-extension.ts            # Table系エクステンションのバンドル設定
├── plugins/
│   ├── katex/
│   │   ├── index.ts                   # KaTeXプラグインエントリ（遅延ロード対象）
│   │   └── katex-node-view.ts         # NodeView実装
│   ├── mermaid/
│   │   ├── index.ts                   # Mermaidプラグインエントリ（遅延ロード対象）
│   │   └── mermaid-node-view.ts       # NodeView実装
│   └── zenn/
│       ├── index.ts                   # Zenn構文プラグインエントリ（遅延ロード対象）
│       └── zenn-nodes.ts              # :::message, :::details カスタムノード
├── stores/
│   └── editor.ts                      # editorState Store（$state ベース）
├── components/
│   └── editor/
│       ├── EditorPage.svelte          # エディターページ全体
│       ├── EditorContainer.svelte     # Tiptapマウントポイント
│       ├── FixedToolbar.svelte        # 固定ツールバー
│       ├── FormatButtonGroup.svelte   # 書式ボタン群
│       ├── HeadingDropdown.svelte     # 見出しドロップダウン
│       ├── ListButtonGroup.svelte     # リストボタン群
│       ├── InsertButtonGroup.svelte   # 挿入ボタン群
│       ├── UndoRedoButtons.svelte     # Undo/Redoボタン
│       ├── OverflowMenu.svelte        # オーバーフローメニュー
│       ├── BubbleToolbar.svelte       # バブルメニュー
│       ├── SlashCommandPalette.svelte # スラッシュコマンドパレット
│       ├── LinkPopover.svelte         # リンク編集ポップオーバー
│       ├── CodeBlockWrapper.svelte    # コードブロックNodeView
│       ├── TableControls.svelte       # テーブル操作メニュー
│       └── AriaLiveRegion.svelte      # スクリーンリーダー通知
└── utils/
    ├── link-validator.ts              # validateLinkUrl()
    ├── keyboard-navigation.ts         # Roving Tabindex ヘルパー
    └── plugin-loader.ts               # loadPluginWithRetry() ユーティリティ
```

## U1パターンとの関係

| U1パターン | U2での利用 |
|---|---|
| P1: 遅延初期化 | P-U2-01でプラグイン遅延ロードとして拡張適用 |
| P2: デバウンス書き込み | P-U2-02で自動保存（1000ms）として適用 |
| R1: セーフラッパー | FileManager経由で間接利用（U2はResult型を受け取る） |
| R2: デフォルトフォールバック | R-U2-02で読み込み失敗時の空ドキュメントフォールバック |
| R3: グレースフルデグラデーション | Web版でのTiptap動作は完全互換（追加対応不要） |
| S1: アダプターパターン | FileManager経由で間接利用 |
| S2: ストアパターン | editorState Storeで拡張適用（Svelte 5 $stateベース） |
