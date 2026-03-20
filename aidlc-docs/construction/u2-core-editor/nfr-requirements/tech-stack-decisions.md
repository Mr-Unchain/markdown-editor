# U2: Core Editor — Tech Stack Decisions

## U1 Tech Stack からの継承
U1で決定済みのコアスタック（SvelteKit 2.x, Svelte 5, Tauri 2.x, TypeScript 5.x, Vite, pnpm, Vitest）はそのまま継承。
以下はU2で追加する技術スタック。

---

## エディターエンジン

| カテゴリ | 選定 | バージョン | 理由 |
|---|---|---|---|
| WYSIWYGエンジン | **Tiptap** | 2.x (latest) | ProseMirrorベース、ヘッドレス設計でSvelte 5と統合可能、エクステンション豊富 |
| スキーマエンジン | **ProseMirror** | (Tiptap同梱) | Tiptapの基盤、ドキュメントモデル・トランザクション管理 |

### 選定理由
- **Tiptap vs Slate.js**: TiptapはProseMirrorベースで安定性が高く、テーブル・コードブロック等のエクステンションが充実。Slate.jsはReact向けの設計。
- **Tiptap vs Quill**: Tiptapはヘッドレスで完全なUI自由度あり。QuillはUI込みで柔軟性が低い。
- **Tiptap vs Lexical**: TiptapはSvelte統合実績あり（公式ドキュメントにSvelte例）。LexicalはMeta製でReact中心。

---

## Tiptap エクステンション

### StarterKit（バンドル）
StarterKitに含まれるエクステンション（個別設定不要）:
- Blockquote, Bold, BulletList, Code, CodeBlock, Document, HardBreak
- Heading, History, HorizontalRule, Italic, ListItem, OrderedList
- Paragraph, Strike, Text

### 追加エクステンション

| パッケージ | 用途 | 設定 |
|---|---|---|
| `@tiptap/extension-table` | テーブルノード | `resizable: false`（MVP） |
| `@tiptap/extension-table-row` | テーブル行ノード | — |
| `@tiptap/extension-table-cell` | テーブルセルノード | — |
| `@tiptap/extension-table-header` | テーブルヘッダーノード | — |
| `@tiptap/extension-task-list` | チェックリスト | — |
| `@tiptap/extension-task-item` | チェックリストアイテム | `nested: true` |
| `@tiptap/extension-link` | リンクMark | `autolink: true`, `openOnClick: false` |
| `@tiptap/extension-placeholder` | プレースホルダー | H1に「タイトルを入力...」表示 |
| `@tiptap/extension-text-align` | テキスト揃え（テーブルセル用） | `types: ['heading', 'paragraph']` |
| `@tiptap/extension-bubble-menu` | バブルメニュー | テキスト選択時に表示 |
| `@tiptap/extension-code-block-lowlight` | コードブロック+ハイライト | StarterKitのCodeBlockを置換 |
| `@tiptap/suggestion` | スラッシュコマンド基盤 | カスタムrender関数でSvelteマウント |
| `@tiptap/markdown` | Markdown入出力 | `markedOptions: { gfm: true }` |

### StarterKitのCodeBlock無効化
```typescript
StarterKit.configure({
  codeBlock: false, // CodeBlockLowlightで置換
})
```

---

## シンタックスハイライト

| カテゴリ | 選定 | バージョン | 理由 |
|---|---|---|---|
| ハイライトライブラリ | **lowlight** | 3.x (latest) | highlight.jsのAST互換パーサー、Tiptap CodeBlockLowlightが依存 |
| 言語定義 | **highlight.js** | 11.x (latest) | lowlightが内部で使用、個別言語インポート可能 |

### バンドル戦略（16言語 個別インポート）
```typescript
import { common, createLowlight } from 'lowlight'
// lowlightのcommonには主要言語が含まれるが、
// バンドルサイズ制御のため個別インポートを使用

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
// ... 他12言語
```

**バンドルサイズ見積り**: lowlightコア(~15KB) + 16言語(~50KB) ≈ ~65KB (gzip後)

---

## スラッシュコマンド

| カテゴリ | 選定 | 理由 |
|---|---|---|
| サジェスション基盤 | `@tiptap/suggestion` | Tiptap公式のサジェスションプラグイン |
| ポジショニング | **tippy.js** | Tiptap suggestionのデフォルトポジショニングライブラリ |
| UIレンダリング | **Svelte 5カスタムコンポーネント** | `suggestion.render()` 内でSvelteコンポーネントを動的マウント |

### 実装方針
- Tiptapの`@tiptap/suggestion`はフレームワーク非依存のrender APIを提供
- render関数内で`mount()`（Svelte 5）を使用してSlashCommandPaletteコンポーネントをマウント
- tippy.jsでカーソル位置にポップアップを配置

---

## 同梱プラグイン実装方式

### ロード戦略: 遅延ロード（動的import）
```typescript
// 使用時に初めてインポート
async function loadKatexPlugin(): Promise<PluginInstance> {
  const { default: katexExtension } = await import('../../plugins/katex')
  return { manifest: KATEX_MANIFEST, extensions: [katexExtension] }
}
```

### 同梱プラグイン別技術選定

| プラグイン | 主要依存 | バンドルサイズ見積 | 備考 |
|---|---|---|---|
| KaTeX | `katex` | ~100KB (gzip) | 数式レンダリング、NodeView |
| Mermaid | `mermaid` | ~300KB (gzip) | 図表レンダリング、NodeView |
| Zenn構文 | カスタム実装 | ~10KB (gzip) | `:::message`, `:::details` 等のカスタムノード |

### 遅延ロードの条件
- **KaTeX**: ドキュメント内に `$` または `$$` が検出された時（InputRuleトリガー）
- **Mermaid**: ドキュメント内に ` ```mermaid ` コードブロックが検出された時
- **Zenn構文**: ドキュメント内に `:::` が検出された時

---

## Markdown入出力

| カテゴリ | 選定 | 理由 |
|---|---|---|
| Markdownパーサー | `@tiptap/markdown` | Tiptap公式Markdown拡張、GFM対応（markedベース） |
| GFMサポート | `marked` (内蔵) | テーブル、タスクリスト、取り消し線のパース |

### 設定
```typescript
Markdown.configure({
  markedOptions: { gfm: true },
})
```

---

## パッケージ依存関係サマリー（U2追加分）

### dependencies
```
@tiptap/core
@tiptap/pm                        # ProseMirrorバンドル
@tiptap/starter-kit
@tiptap/extension-table
@tiptap/extension-table-row
@tiptap/extension-table-cell
@tiptap/extension-table-header
@tiptap/extension-task-list
@tiptap/extension-task-item
@tiptap/extension-link
@tiptap/extension-placeholder
@tiptap/extension-text-align
@tiptap/extension-bubble-menu
@tiptap/extension-code-block-lowlight
@tiptap/suggestion
@tiptap/markdown
lowlight
tippy.js
katex                             # 同梱プラグイン（遅延ロード）
mermaid                           # 同梱プラグイン（遅延ロード）
```

### devDependencies
```
# U1から追加なし（Vitest, @testing-library/svelte はU1で導入済み）
```

---

## context7検証メモ

- **Tiptap Svelte 5初期化**: `onMount` 内で `new Editor()`, `$state` でインスタンス管理、`onTransaction` で再レンダリング（context7 公式Svelte例に準拠）
- **CodeBlockLowlight**: `@tiptap/extension-code-block-lowlight` + `lowlight`。StarterKitの `codeBlock: false` で置換（context7ドキュメントに記載）
- **highlight.js個別インポート**: `highlight.js/lib/languages/javascript` 形式で言語別インポート可能（context7 highlight.js README準拠）
- **Suggestion**: `@tiptap/suggestion` のrender APIでSvelteコンポーネントをマウント（React/Vueの例を参考にSvelte 5 mount APIで実装）
- **Markdown**: `@tiptap/markdown` + `markedOptions: { gfm: true }` でGFM対応（context7 Tiptap Markdown例に準拠）
- **アクセシビリティ**: Tiptap公式ガイドでエディター `role="textbox"`, ツールバー `role="toolbar"`, メニュー `role="menu"` を推奨（context7 accessibility guide準拠）
