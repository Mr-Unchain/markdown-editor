# U2: Core Editor — NFR Design Patterns

## パフォーマンスパターン

### P-U2-01: エクステンション遅延登録（Lazy Extension Registration）
**対象**: 同梱プラグイン（KaTeX, Mermaid, Zenn構文）
**NFR**: NFR-U2-02（エディター初期化200ms以下）

```
EditorCore.initialize()
    |
    v
[即時] StarterKit + 必須エクステンション登録        < 100ms
    |    (Table, Link, Placeholder, CodeBlockLowlight,
    |     TaskList, BubbleMenu, TextAlign, Markdown, SlashCommand)
    |
    v
[即時] エディター初回レンダリング                    < 50ms
    |
    v
[遅延] 同梱プラグインのTiptapエクステンション        バックグラウンド
    |    → ドキュメント内容スキャンでトリガー:
    |      - '$' or '$$' 検出 → KaTeX遅延ロード
    |      - '```mermaid' 検出 → Mermaid遅延ロード
    |      - ':::' 検出 → Zenn構文遅延ロード
    |
    v
[遅延ロード完了] editor.registerPlugin() で動的追加
```

**実装方針**:
- 必須エクステンション（StarterKit + 12個）は同期登録で150ms以内に完了
- 同梱プラグイン（KaTeX/Mermaid/Zenn）は `dynamic import()` で初回トリガー時にロード
- ロード中はプレースホルダーノード表示（「読み込み中...」）

### P-U2-02: デバウンス自動保存（Debounced Auto-Save）
**対象**: EditorCore → FileManager 連携
**NFR**: NFR-U2-08（ドキュメントデータ保全、自動保存デバウンス1秒）

```typescript
// EditorCore内での自動保存パターン
class EditorCore {
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private readonly AUTOSAVE_DEBOUNCE_MS = 1000

  private onDocumentUpdate(): void {
    // 1. SaveStatus を即時更新
    saveStatus.set('unsaved')

    // 2. 自動保存をデバウンス
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.autoSave(), this.AUTOSAVE_DEBOUNCE_MS)
  }

  private async autoSave(): Promise<void> {
    const markdown = this.getMarkdown()
    const result = await this.fileManager.saveFile(this.currentPath, markdown)
    if (result.ok) {
      saveStatus.set('saved')
    } else {
      saveStatus.set('error')
      notify('error', `保存に失敗しました: ${result.error.message}`)
    }
  }
}
```

### P-U2-03: シンタックスハイライト最適化（Optimized Syntax Highlighting）
**対象**: CodeBlockLowlight
**NFR**: NFR-U2-05（ハイライト処理100ms以内、バンドル100KB以下）

```
コードブロック言語変更
    |
    v
[同期] lowlight.highlight(code, { language })
    |
    +-- 500行以下 → 即時ハイライト（< 100ms）
    |
    +-- 500行超 → チャンク分割ハイライト
         |    最初の100行を即時処理
         |    残りをrequestIdleCallback()で段階処理
         |    処理中は「ハイライト中...」インジケーター
```

**バンドル戦略**:
```typescript
// 個別インポートでバンドルサイズ制御
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
// ... 14言語追加（計16言語、~65KB gzip）

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
// ...
```

### P-U2-04: スラッシュコマンド高速フィルタリング（Fast Command Filtering）
**対象**: SlashCommandPalette
**NFR**: NFR-U2-04（パレット表示50ms以内、フィルタリング16ms以内）

```
'/' 入力
    |
    v
[即時] @tiptap/suggestion トリガー                   < 10ms
    |
    v
[即時] tippy.js ポップアップ生成                       < 20ms
    |    + Svelte 5 mount(SlashCommandPalette)
    |
    v
[即時] 全コマンド候補表示（静的配列、フィルタなし）   < 20ms
    |
    v
[テキスト入力時] $derived() で即時フィルタ             < 1ms
    |    前方一致 + エイリアス検索（12アイテム線形検索）
```

**実装方針**:
- コマンド候補は静的配列（12アイテム）→ フィルタリングコストは無視できるレベル
- `$derived()` でリアクティブに候補リスト更新（仮想DOMなしのSvelte 5 fine-grained reactivity）
- tippy.js の `appendTo: 'parent'` でDOM階層を最小化

### P-U2-05: Markdown変換バッファリング（Buffered Markdown Conversion）
**対象**: @tiptap/markdown 拡張
**NFR**: NFR-U2-06（ProseMirrorDoc→Markdown: 200KB/100ms、Markdown→Doc: 200KB/200ms）

```
【保存時】ProseMirrorDoc → Markdown
    |
    v
editor.storage.markdown.getMarkdown()
    → markedによるシリアライズ（GFM有効）
    → 200KB文書で ~80ms（マージン20ms）

【読み込み時】Markdown → ProseMirrorDoc
    |
    v
editor.commands.setContent(markdown, { emitUpdate: false })
    → @tiptap/markdown が contentType 検出 → marked でパース
    → ProseMirrorスキーマに変換
    → 200KB文書で ~150ms（マージン50ms）
    → emitUpdate: false で不要な自動保存トリガーを防止
```

---

## 信頼性パターン

### R-U2-01: エクステンションエラー隔離（Extension Error Isolation）
**対象**: 全Tiptapエクステンション
**NFR**: NFR-U2-07（エクステンション初期化失敗時もエディター正常動作）

```
EditorCore.initialize()
    |
    v
エクステンション登録ループ:
    for each extension in allExtensions:
        |
        try {
            editor.registerPlugin(extension)
        } catch (e) {
            → failedExtensions.push(extension.name)
            → continue（他のエクステンションは影響なし）
        }
    |
    v
failedExtensions.length > 0 ?
    → Yes: notify('warning', `${names}の読み込みに失敗しました`)
    → No: 正常起動完了
```

**実装方針**:
```typescript
function safeRegisterExtensions(
  coreExtensions: Extension[],
  optionalExtensions: Extension[]
): { extensions: Extension[]; failed: string[] } {
  const failed: string[] = []
  const safe: Extension[] = [...coreExtensions] // コアは常に登録

  for (const ext of optionalExtensions) {
    try {
      // エクステンション設定のバリデーション
      ext.configure?.({})
      safe.push(ext)
    } catch (e) {
      failed.push(ext.name)
      console.error(`[EditorCore] Extension "${ext.name}" failed:`, e)
    }
  }

  return { extensions: safe, failed }
}
```

**分類**:
- **コアエクステンション**（失敗時はエディター起動中止）:
  - StarterKit, Document, Paragraph, Text
- **オプショナルエクステンション**（失敗時は機能縮退で継続）:
  - Table系, CodeBlockLowlight, TaskList, Link, BubbleMenu, Placeholder, TextAlign, Markdown, SlashCommand

### R-U2-02: ドキュメント整合性保護（Document Integrity Protection）
**対象**: ProseMirrorDoc ↔ Markdown変換
**NFR**: NFR-U2-08（変換エラー時のロールバック）

```
保存処理（ProseMirrorDoc → Markdown）:
    |
    v
(1) editor.storage.markdown.getMarkdown()
    |
    +-- 正常 → FileManager.saveFile(path, markdown)
    |             +-- 保存成功 → SaveStatus = 'saved'
    |             +-- 保存失敗 → SaveStatus = 'error', 通知表示
    |
    +-- 異常（空文字列 or null）
              → ProseMirrorDoc を JSON形式で緊急保存
              → notify('error', 'Markdown変換に失敗。データは保全されています。')
              → SaveStatus = 'error'
```

```
読み込み処理（Markdown → ProseMirrorDoc）:
    |
    v
(1) editor.commands.setContent(markdown)
    |
    +-- 正常 → エディター表示
    |
    +-- 例外発生
              → 空ドキュメントで初期化
              → notify('error', 'ファイルの読み込みに失敗しました')
              → 元のMarkdownファイルは変更しない
```

### R-U2-03: プラグイン遅延ロードリトライ（Plugin Lazy Load Retry）
**対象**: 同梱プラグインの動的インポート
**NFR**: NFR-U2-09（3回リトライ、指数バックオフ）

```typescript
async function loadPluginWithRetry(
  loader: () => Promise<PluginInstance>,
  pluginName: string,
  maxRetries = 3
): Promise<PluginInstance | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await loader()
    } catch (e) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  // 最終失敗
  notify('warning', `${pluginName}プラグインの読み込みに失敗しました`)
  return null
}
```

---

## アクセシビリティパターン

### A-U2-01: WAI-ARIA ロールマッピング（WAI-ARIA Role Mapping）
**対象**: 全エディターUIコンポーネント
**NFR**: NFR-U2-10（WCAG 2.1 AAA準拠）

| コンポーネント | role | aria属性 | 追加属性 |
|---|---|---|---|
| EditorContainer | `textbox` | `aria-multiline="true"`, `aria-label="エディター"` | — |
| FixedToolbar | `toolbar` | `aria-label="書式ツールバー"` | `aria-orientation="horizontal"` |
| BubbleToolbar | `toolbar` | `aria-label="インライン書式"` | — |
| SlashCommandPalette | `listbox` | `aria-label="コマンドパレット"` | `aria-activedescendant` |
| SlashCommandItem | `option` | `aria-selected` | — |
| CodeBlockWrapper言語選択 | `combobox` | `aria-label="プログラミング言語"` | `aria-expanded`, `aria-controls` |
| LinkPopover | `dialog` | `aria-label="リンク編集"` | `aria-modal="true"` |
| TableControls | `menu` | `aria-label="テーブル操作"` | — |
| TableControls各操作 | `menuitem` | — | — |

### A-U2-02: キーボードナビゲーションパターン（Keyboard Navigation Pattern）
**対象**: FixedToolbar, BubbleToolbar, SlashCommandPalette
**NFR**: NFR-U2-11

```
【ツールバーのRoving Tabindex パターン】
    Tab → ツールバーにフォーカス（最初のボタン）
    → 左右矢印キーでボタン間移動
    → Enter/Space で実行
    → Tab → エディター領域にフォーカス移動

実装:
    - ツールバー自体は tabindex="0"
    - 各ボタンは tabindex="-1"（現在フォーカスのみ tabindex="0"）
    - フォーカス位置をリアクティブ変数で管理
```

```
【SlashCommandPaletteのリストボックスパターン】
    '/' 入力 → パレット表示、最初のアイテムにフォーカス
    → ↑↓ でアイテム間移動（ループ）
    → Enter で選択実行
    → Escape でキャンセル（パレット閉じ）
    → 文字入力でフィルタリング

実装:
    - aria-activedescendant でフォーカス管理（DOMフォーカスはエディターに残す）
    - selectedIndex を $state で管理
```

### A-U2-03: ライブリージョン通知（Live Region Notification）
**対象**: 書式変更のスクリーンリーダー通知
**NFR**: NFR-U2-10（スクリーンリーダー対応）

```typescript
// 書式適用時にaria-liveでアナウンス
function announceFormatChange(formatName: string, isActive: boolean): void {
  const message = isActive
    ? `${formatName}を適用しました`
    : `${formatName}を解除しました`
  // aria-live="polite" リージョンにメッセージを設定
  ariaLiveRegion.textContent = message
}
```

```svelte
<!-- 画面外に配置したライブリージョン -->
<div
  bind:this={ariaLiveRegion}
  role="status"
  aria-live="polite"
  class="sr-only"
></div>
```

---

## セキュリティパターン

### S-U2-01: ペーストサニタイズ（Paste Sanitization）
**対象**: エディターへのHTMLペースト
**NFR**: NFR-U2-15（XSSプロテクション）

```
クリップボードペースト
    |
    v
Tiptap のデフォルトペースト処理:
    → ProseMirrorスキーマに定義されたノード/マークのみ許可
    → 未定義のHTML要素は自動除去
    |
    v
追加バリデーション:
    → <script>, <iframe>, <object>, <embed> は明示的にブロック
    → onXxx イベントハンドラ属性は除去
    → style属性は除去（Tiptapのスタイル管理に統一）
```

### S-U2-02: リンクURLバリデーション（Link URL Validation）
**対象**: LinkPopover
**NFR**: NFR-U2-15（`javascript:` プロトコル拒否）

```typescript
function validateLinkUrl(url: string): { valid: boolean; sanitized: string } {
  const trimmed = url.trim()

  // プロトコル検査
  const dangerous = /^(javascript|data|vbscript):/i
  if (dangerous.test(trimmed)) {
    return { valid: false, sanitized: '' }
  }

  // プロトコルなしの場合は https:// を付与
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/') && !trimmed.startsWith('#')) {
    return { valid: true, sanitized: `https://${trimmed}` }
  }

  return { valid: true, sanitized: trimmed }
}
```

---

## レスポンシブパターン

### RS-U2-01: ツールバーオーバーフロー管理（Toolbar Overflow Management）
**対象**: FixedToolbar
**NFR**: NFR-U2-12

```
ツールバー幅チェック（ResizeObserver）:
    |
    v
ボタン群がコンテナ幅を超える？
    |
    +-- No → 全ボタン表示
    |
    +-- Yes → 優先度に基づき収納:
         (1) UndoRedoButtons → オーバーフローメニューへ
         (2) InsertButtonGroup → オーバーフローメニューへ
         (3) ListButtonGroup → オーバーフローメニューへ
         ※ FormatButtonGroup と HeadingDropdown は常時表示
```

```typescript
// ResizeObserverでツールバー幅を監視
let toolbarWidth = $state(0)
let overflowItems = $derived(
  calculateOverflow(toolbarWidth, buttonGroups)
)
```

---

## context7検証メモ

- **Tiptap エクステンション動的登録**: `editor.registerPlugin()` ではなく `editor.extensionManager` を使用。ただし動的追加はTiptap公式ではサポートが限定的なため、同梱プラグインは初期化時に全て登録し、NodeViewで遅延レンダリングする方式が安全（context7 Tiptap Plugin guide参照）
- **ProseMirrorスキーマによるサニタイズ**: Tiptapはスキーマに定義されたノード/マークのみをパースするため、基本的なXSS対策は自動（context7 Tiptap content guide参照）
- **Svelte 5 $derived**: フィルタリング等のリアクティブ計算は `$derived()` で宣言的に記述（context7 Svelte 5 runes参照）
- **aria-activedescendant**: リストボックスパターンではDOMフォーカスを移動せず `aria-activedescendant` で仮想フォーカスを管理（WAI-ARIA Practices準拠）
