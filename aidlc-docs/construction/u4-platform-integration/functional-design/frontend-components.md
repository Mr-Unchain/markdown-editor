# U4 Platform Integration — フロントエンドコンポーネント設計

## コンポーネント一覧

| コンポーネント | 親 | 責務 |
|---|---|---|
| PublishDialog | UIShell.dialogs | 投稿設定ダイアログ |
| PlatformSettingsDialog | UIShell.dialogs | プラットフォーム接続設定 |
| PlatformConnectionCard | PlatformSettingsDialog | 各プラットフォームの接続カード |
| ExportMenu | Toolbar | エクスポートメニュー |
| ImageDropOverlay | EditorArea | 画像D&Dオーバーレイ |
| PublishProgressIndicator | PublishDialog | 投稿進捗表示 |
| NotificationToast | UIShell | 通知トースト |

---

## コンポーネント階層

```
UIShell (既存)
  +-- Toolbar (既存)
  |     +-- ExportMenu (新規)
  |     +-- PublishButton (新規)
  +-- EditorArea (既存)
  |     +-- ImageDropOverlay (新規)
  +-- StatusBar (既存)
  +-- dialogs/
        +-- PublishDialog (新規)
        |     +-- PublishProgressIndicator (新規)
        +-- PlatformSettingsDialog (新規)
              +-- PlatformConnectionCard (新規) × n
  +-- NotificationToast (新規)
```

---

## PublishDialog

投稿設定と実行を行うモーダルダイアログ。

### Props

```typescript
interface PublishDialogProps {
  isOpen: boolean
  onClose: () => void
  currentFilePath: string | null   // 現在編集中のファイル
}
```

### 内部State

```typescript
// Svelte 5 runes
let selectedPlatform = $state<string>('zenn')
let title = $state<string>('')
let slug = $state<string>('')            // Zenn URLスラッグ（空ならランダム生成）
let tags = $state<string[]>([])
let emoji = $state<string>('📝')         // Zenn記事絵文字
let articleType = $state<'tech' | 'idea'>('tech')  // Zenn固有
let publishAs = $state<'draft' | 'public'>('draft')
let isPublishing = $state<boolean>(false)
let existingRecord = $state<PublishRecord | null>(null)

// frontmatterからの初期値読み込み（title, slug, emoji, tags, articleType, publishRecord）
let initialized = $derived(/* frontmatter解析結果 */)
```

### UI構成

```
+-----------------------------------------------+
|  記事を投稿                              [×]  |
+-----------------------------------------------+
|                                               |
|  投稿先: [Zenn ▼]                             |
|                                               |
|  ┌─────────────────────────────────────────┐  |
|  │ タイトル                                 │  |
|  │ [                                      ] │  |
|  │                                         │  |
|  │ トピック（カンマ区切り、最大5個）        │  |
|  │ [svelte, typescript                   ] │  |
|  │                                         │  |
|  │ 絵文字: [📝] (クリックで変更)             │  |
|  │                                         │  |
|  │ 記事タイプ: (●) tech  ( ) idea          │  |
|  │                                         │  |
|  │ 公開設定:  (●) 下書き  ( ) 公開         │  |
|  │                                         │  |
|  │ ▸ 詳細設定                              │  |
|  │   スラッグ: [           ] (空=自動生成)  │  |
|  └─────────────────────────────────────────┘  |
|                                               |
|  ⚠ この記事は2026-03-20に投稿済みです        |
|                                               |
|  [キャンセル]            [下書き保存]         |
+-----------------------------------------------+
```

### ユーザーインタラクション

1. ダイアログオープン → frontmatterから既存情報を読み込み（タイトル、タグ、投稿履歴）
2. フォーム入力 → リアルタイムバリデーション（BR-U4-01〜05）
3. 投稿ボタン押下 → 既存投稿チェック → 確認ダイアログ（BR-U4-15）→ PublishService.publish()
4. 投稿中 → PublishProgressIndicator表示
5. 成功 → 成功通知 + ダイアログクローズ
6. 失敗 → リトライダイアログ（BR-U4-16）

---

## PlatformSettingsDialog

プラットフォーム接続設定を管理するモーダルダイアログ。

### Props

```typescript
interface PlatformSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}
```

### UI構成

```
+-----------------------------------------------+
|  プラットフォーム設定                    [×]  |
+-----------------------------------------------+
|                                               |
|  ┌─── Zenn (GitHub連携) ──────── [接続済み] ┐ |
|  │                                          │ |
|  │  GitHub Token: [••••••••••••••••]        │ |
|  │  リポジトリ:    owner / repo-name        │ |
|  │  ブランチ:      [main          ]         │ |
|  │                                          │ |
|  │  [接続テスト]  結果: ✅ 接続成功          │ |
|  │                                          │ |
|  │  [保存]  [認証情報を削除]                │ |
|  └──────────────────────────────────────────┘ |
|                                               |
|  ┌─── note ──────────────── [未接続] ───────┐ |
|  │  (Post-MVP)                              │ |
|  └──────────────────────────────────────────┘ |
|                                               |
|  ┌─── microCMS ────────────── [未接続] ─────┐ |
|  │  (Post-MVP)                              │ |
|  └──────────────────────────────────────────┘ |
|                                               |
|  [閉じる]                                     |
+-----------------------------------------------+
```

### ユーザーインタラクション

1. ダイアログオープン → SettingsManagerから既存の認証情報を読み込み
2. トークン入力 → マスク表示（`type="password"`）
3. [接続テスト] → adapter.testConnection() → 結果表示
4. [保存] → SettingsManager.setPlatformCredentials() → 自動接続テスト（BR-U4-12）
5. [認証情報を削除] → 確認ダイアログ → SettingsManager.removePlatformCredentials()

---

## PlatformConnectionCard

各プラットフォームの接続情報を表示・編集するカードコンポーネント。

### Props

```typescript
interface PlatformConnectionCardProps {
  platformId: string
  platformName: string
  isConnected: boolean
  isPostMVP: boolean           // Post-MVPの場合はdisabled表示
  onSave: (credentials: PlatformCredentials) => Promise<void>
  onTest: () => Promise<ConnectionTestResult>
  onRemove: () => Promise<void>
}
```

---

## ExportMenu

ツールバーのエクスポートドロップダウンメニュー。

### Props

```typescript
interface ExportMenuProps {
  disabled: boolean            // エディターが空の場合はdisabled
}
```

### UI構成

```
[エクスポート ▼]
  +-------------------------------+
  |  📋 Markdownをコピー          |
  |  📋 HTMLをコピー              |
  |  ─────────────────────────── |
  |  💾 Markdownとしてダウンロード  |
  |  💾 HTMLとしてダウンロード      |
  +-------------------------------+
```

### スラッシュコマンド連携

既存のスラッシュコマンドシステム（U2で実装済み）に以下を追加:
- `/export markdown` → Markdownコピー
- `/export html` → HTMLコピー
- `/export download-md` → Markdownダウンロード
- `/export download-html` → HTMLダウンロード

---

## ImageDropOverlay

画像ドラッグ&ドロップ時のオーバーレイ表示。

### Props

```typescript
interface ImageDropOverlayProps {
  // propsなし — エディターエリアの子として配置
}
```

### 内部State

```typescript
let isDragOver = $state<boolean>(false)
let isProcessing = $state<boolean>(false)
```

### UI構成

```
（通常時: 非表示）

（ドラッグオーバー時:）
+-----------------------------------------------+
|                                               |
|           ┌───────────────────┐               |
|           │    📷             │               |
|           │  画像をドロップ     │               |
|           │  して挿入          │               |
|           └───────────────────┘               |
|                                               |
+-----------------------------------------------+
（半透明オーバーレイ、ボーダーアニメーション）

（処理中:）
+-----------------------------------------------+
|           ┌───────────────────┐               |
|           │    ⏳ 保存中...    │               |
|           └───────────────────┘               |
+-----------------------------------------------+
```

### イベントハンドリング

```typescript
// エディターエリアのイベントリスナー
function handleDragEnter(e: DragEvent) {
  if (hasImageFiles(e)) isDragOver = true
}
function handleDragLeave(e: DragEvent) {
  isDragOver = false
}
async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver = false
  isProcessing = true
  await imageManager.handleDrop(e)
  isProcessing = false
}
```

---

## PublishProgressIndicator

投稿進捗を表示するコンポーネント。

### Props

```typescript
interface PublishProgressIndicatorProps {
  progress: PublishProgress
}
```

### UI構成

```
+-----------------------------------------------+
|  投稿中...                                    |
|                                               |
|  ✅ バリデーション                            |
|  ✅ フォーマット変換                          |
|  🔄 画像アップロード (2/5)                    |
|  ⏳ 記事投稿                                  |
|  ⏳ frontmatter更新                           |
|                                               |
|  [━━━━━━━━━━░░░░░░░░░░] 40%                  |
+-----------------------------------------------+
```

---

## NotificationToast

操作結果の通知トースト。

### Props

```typescript
interface NotificationToastProps {
  // Storeベースで管理
}
```

### 通知タイプ

| タイプ | 表示 | 自動消去 |
|---|---|---|
| success | 緑 | 3秒 |
| error | 赤 | 手動消去 |
| info | 青 | 3秒 |
| warning | 黄 | 5秒 |

---

## ストア設計

### publishStore

```typescript
// src/lib/stores/publish-store.svelte.ts

class PublishStore {
  // 投稿進捗
  progress = $state<PublishProgress>({
    status: 'idle',
    currentStep: 'validate',
    totalSteps: 7,  // 画像なしの場合は5（upload-images, replace-urls をスキップ）
    completedSteps: 0
  })

  // 利用可能プラットフォーム
  platforms = $state<PlatformInfo[]>([])

  // アクション（PublishResult は domain-entities.md / component-methods.md で定義）
  async publish(platformId: string, options: PublishOptions): Promise<PublishResult>
  async exportToClipboard(format: ExportFormat): Promise<void>
  async exportToFile(format: ExportFormat): Promise<void>

  // リセット
  reset(): void
}

export const publishStore = new PublishStore()
```

### platformStore

```typescript
// src/lib/stores/platform-store.svelte.ts

class PlatformStore {
  // 接続情報
  connections = $state<Map<string, PlatformConnection>>(new Map())

  // アクション
  async loadConnections(): Promise<void>
  async saveCredentials(platformId: string, credentials: PlatformCredentials): Promise<void>
  async removeCredentials(platformId: string): Promise<void>
  async testConnection(platformId: string): Promise<ConnectionTestResult>

  // 派生状態
  get connectedPlatforms(): PlatformConnection[]
  isConnected(platformId: string): boolean
}

export const platformStore = new PlatformStore()
```

### imageStore

```typescript
// src/lib/stores/image-store.svelte.ts

class ImageStore {
  // 画像挿入中フラグ
  isInserting = $state<boolean>(false)

  // アップロード進捗
  uploadProgress = $state<{
    total: number
    completed: number
    currentFile: string
  } | null>(null)

  // アクション
  // filePath: 対象MDファイルのパス（.assets/ ディレクトリ決定に必要）
  // ※ component-methods.md C5 の ImageManager インターフェースを拡張（filePath パラメータ追加）
  async insertFromDrop(event: DragEvent, filePath: string): Promise<ImageInsertResult>
  async insertFromPaste(event: ClipboardEvent, filePath: string): Promise<ImageInsertResult>
  async insertFromFile(file: File, filePath: string): Promise<ImageInsertResult>
  async insertFromSlashCommand(filePath: string): Promise<ImageInsertResult>  // /image コマンド用
}

export const imageStore = new ImageStore()
```

### notificationStore

```typescript
// src/lib/stores/notification-store.svelte.ts

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration: number             // ms, 0 = 手動消去
}

class NotificationStore {
  notifications = $state<Notification[]>([])

  show(type: Notification['type'], message: string, duration?: number): void
  dismiss(id: string): void
  clear(): void
}

export const notificationStore = new NotificationStore()
```
