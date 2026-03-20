# U2: Core Editor — ビジネスロジックモデル

## 1. EditorCore 初期化フロー

```
[アプリ起動]
  → +page.svelte マウント
    → EditorCore.initialize(container, options)
      → Tiptap Editor インスタンス生成
        → StarterKit 登録（見出し, 太字, 斜体, 取消線, リスト, 引用, コードブロック, 水平線）
        → 追加エクステンション登録:
          - TaskList + TaskItem（チェックリスト）
          - Table + TableRow + TableCell + TableHeader
          - CodeBlockLowlight（highlight.js ベース）
          - Link（自動リンク化有効）
          - Placeholder（H1「タイトルを入力...」）
          - Markdown（GFM有効 — markedOptions: { gfm: true }）
          - SlashCommand（@tiptap/suggestion ベースのカスタム実装）
        → PluginSystem.getEditorExtensions() で同梱プラグインを追加登録
      → onUpdate コールバック設定（ドキュメント変更通知）
      → onSelectionChange コールバック設定（選択範囲通知）
    → FixedToolbar マウント（editor インスタンス参照）
    → BubbleMenu マウント（editor インスタンス参照）
```

## 2. ドキュメント操作ワークフロー

### 2.1 ファイルを開く → エディターにロード

```
FileManager.openFile(path)
  → FileSystemAdapter.readFile(path) → Markdown文字列取得
  → EditorCore.setContent(markdown)
    → Tiptap editor.commands.setContent(markdown)
      ※ contentType: 'markdown' で @tiptap/markdown が自動パース
  → SaveStatus → 'saved'
```

### 2.2 編集 → 自動保存フロー

```
ユーザー入力
  → Tiptap onUpdate({ editor }) コールバック発火
  → EditorCore.onUpdate → FileManager.markDirty(currentPath)
  → SaveStatus → 'unsaved'
  → [デバウンス 1000ms]
    → EditorCore.getMarkdown() → Markdown文字列
    → FileManager.saveFile(path, markdown)
    → SaveStatus → 'saved'
```

### 2.3 Markdown ↔ ProseMirror Doc 変換

```
【入力時】 Markdown → ProseMirrorDoc
  手段: @tiptap/markdown 拡張の contentType: 'markdown'
  GFM対応: markedOptions: { gfm: true } でテーブル・タスクリストをパース

【出力時】 ProseMirrorDoc → Markdown
  手段: editor.storage.markdown.getMarkdown()
  GFM対応: テーブル・タスクリストを GFM 記法で出力
```

## 3. 書式コマンド実行フロー

### 3.1 ツールバーからの書式適用

```
ユーザー: ツールバーボタンクリック
  → editor.chain().focus().toggleBold().run()  ※太字の例
  → ProseMirrorトランザクション発行
  → onUpdate 発火 → UI再レンダリング
  → ツールバーボタンの isActive 状態更新
```

### 3.2 バブルメニューからの書式適用

```
ユーザー: テキスト選択
  → BubbleMenu 表示（Tiptap BubbleMenu拡張が制御）
  → ボタンクリック → editor.chain().focus().toggleItalic().run() 等
  → 選択範囲に書式適用
```

### 3.3 Markdown自動変換（InputRule）

```
ユーザー: '## ' と入力
  → Tiptap InputRule が検知
  → 自動的に H2 見出しノードに変換
  → 入力テキスト '## ' はノードに吸収

対応する InputRule 一覧:
  - '# '〜'###### '     → H1〜H6
  - '- '/'* '           → 箇条書きリスト
  - '1. '               → 番号付きリスト
  - '- [ ] '/'- [x] '   → タスクリスト
  - '> '                → 引用ブロック
  - '```'               → コードブロック
  - '---'/'***'         → 水平線
  - '**text**'          → 太字
  - '*text*'/'_text_'   → 斜体
  - '~~text~~'          → 取り消し線
  - '`code`'            → インラインコード
```

## 4. スラッシュコマンドフロー

```
ユーザー: '/' を入力（行頭または空白後）
  → @tiptap/suggestion プラグインが検知
  → SlashCommandPalette コンポーネント表示（カーソル直下）
  → コマンド候補リスト表示:
    - テキスト（段落）
    - 見出し1/見出し2/見出し3
    - 箇条書きリスト
    - 番号付きリスト
    - チェックリスト
    - コードブロック
    - テーブル
    - 引用
    - 区切り線
    - 画像 (※U4で実装、U2ではプレースホルダー)
  → テキスト入力でフィルタリング（前方一致 + エイリアス検索）
  → 矢印キーで選択移動、Enter/クリックで実行
  → editor.chain().focus().deleteRange(range).setNode(...).run()
  → Escape でキャンセル（'/' テキストを残す）
```

## 5. Undo/Redo フロー

```
Tiptap StarterKit に History 拡張が含まれる（デフォルト有効）:
  - Ctrl/Cmd+Z → editor.commands.undo()
  - Ctrl/Cmd+Shift+Z → editor.commands.redo()
  - 履歴はエディターインスタンスのライフサイクルに紐づく
  - ファイル保存しても履歴は保持（セッション中）
  - ファイル切り替え時は別のエディター状態（履歴はタブごとに独立）
```

## 6. PluginSystem 初期化フロー

```
[アプリ起動時]
  PluginSystem.initialize(settingsManager)
    → 同梱プラグインディレクトリ（plugins/）をスキャン
    → マニフェスト（manifest.json）読み込み
    → SettingsManager から有効/無効設定を取得
    → 有効なプラグインを遅延ロード対象として登録

[EditorCore初期化時]
  PluginSystem.getEditorExtensions()
    → 有効な editor-extension 型プラグインのTiptapエクステンションを返却
    → EditorCore が extensions 配列に追加

同梱プラグイン（MVP）:
  1. KaTeX — 数式レンダリング（$...$ / $$...$$）
  2. Mermaid — 図表レンダリング（```mermaid）
  3. Zenn構文 — Zenn独自記法（:::message, :::details 等）
```

## 7. テーブル操作ロジック

```
テーブル挿入:
  → editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()

行追加: editor.chain().focus().addRowAfter().run()
行削除: editor.chain().focus().deleteRow().run()
列追加: editor.chain().focus().addColumnAfter().run()
列削除: editor.chain().focus().deleteColumn().run()

セル間移動:
  Tab → 次のセル（行末の場合は次の行の先頭）
  Shift+Tab → 前のセル

セル内容揃え:
  TextAlign 拡張で left/center/right を切り替え
```

## 8. コードブロックのシンタックスハイライト

```
CodeBlockLowlight 拡張:
  → lowlight ライブラリ（highlight.js のAST互換パーサー）
  → 主要言語をバンドル:
    javascript, typescript, python, rust, go,
    html, css, json, yaml, shell, markdown, sql, java, c, cpp
  → 言語選択: コードブロック上部にドロップダウン表示
  → デフォルト言語: 'plaintext'
  → コードブロック内ではエディターショートカット無効化
  → 脱出: 下矢印キー（最終行）またはEscapeで次のブロックへ
```
