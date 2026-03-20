# U2: Core Editor — Functional Design Plan

## 対象ユニット
U2: Core Editor（WYSIWYGマークダウン編集エンジン）

## 対象ストーリー
- US-01: リッチテキスト編集
- US-02: リスト・チェックリスト編集
- US-03: テーブル編集
- US-04: コードブロック編集
- US-05: 引用・区切り線・リンク
- US-06: スラッシュコマンド
- US-07: キーボードショートカット
- US-08: Undo/Redo

## 対象コンポーネント
- C1: EditorCore（Tiptap v2エディターエンジン）
- C3: PluginSystem（プラグイン基盤）
- C8: UIShell（ツールバー、コマンドパレット）

## Functional Designステップ

### Part 1: 質問収集
- [x] Step 1: ユニット定義・ストーリー・コンポーネントメソッドの分析
- [x] Step 2: context7でTiptap v2 + Svelte 5の最新APIを確認
- [x] Step 3: Functional Design質問ファイルの作成
- [x] Step 4: ユーザー回答の収集と曖昧さ分析

### Part 2: 成果物生成
- [x] Step 5: ビジネスロジックモデル（business-logic-model.md）作成
  - EditorCoreの初期化フロー
  - ドキュメント操作のワークフロー
  - Markdown ↔ ProseMirror Doc変換ロジック
  - **context7検証**: Tiptap Markdown拡張のgetMarkdown/setContent API確認 ✅
- [x] Step 6: ドメインエンティティ（domain-entities.md）作成
  - ProseMirrorドキュメントモデル
  - エディターコマンド型定義
  - プラグインマニフェスト構造
  - **context7検証**: Tiptap Extension/Node/Mark型定義確認 ✅
- [x] Step 7: ビジネスルール（business-rules.md）作成
  - 書式適用ルール（選択範囲ベース vs ブロックレベル）
  - Markdown自動変換ルール
  - スラッシュコマンドフィルタリングロジック
  - Undo/Redo履歴管理ルール
  - **context7検証**: Tiptap InputRule, PasteRule仕様確認 ✅
- [x] Step 8: フロントエンドコンポーネント設計（frontend-components.md）作成
  - EditorContainer（Tiptapマウント）
  - FormattingToolbar（書式ツールバー）
  - SlashCommandPalette（コマンドパレット）
  - CodeBlockWrapper（言語選択付きコードブロック）
  - TableControls（行列操作UI）
  - LinkEditor（リンク編集ポップオーバー）
  - **context7検証**: Svelte 5 onMount/onDestroyでのTiptap初期化パターン確認 ✅
- [x] Step 9: プラン内チェックボックス更新 + aidlc-state.md更新
- [x] Step 10: 完了メッセージの提示・ユーザー承認待ち
