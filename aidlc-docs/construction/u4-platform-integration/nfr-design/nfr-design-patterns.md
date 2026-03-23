# U4 Platform Integration — NFR Design Patterns

## パターン一覧

| ID | カテゴリ | パターン名 | 対応NFR |
|---|---|---|---|
| P-U4-01 | パフォーマンス | 非同期パイプライン | NFR-U4-05, NFR-U4-20 |
| P-U4-02 | パフォーマンス | 遅延初期化 | NFR-U4-04 |
| P-U4-03 | パフォーマンス | 進捗ストリーミング | NFR-U4-05 |
| P-U4-04 | パフォーマンス | バンドル最適化 | NFR-U4-19 |
| P-U4-05 | パフォーマンス | キャンセラブルパイプライン | NFR-U4-20 |
| R-U4-01 | 信頼性 | オフラインファースト | NFR-U4-06, NFR-U4-07 |
| R-U4-02 | 信頼性 | リトライダイアログ | NFR-U4-07, NFR-U4-08 |
| R-U4-03 | 信頼性 | 部分失敗リカバリ | NFR-U4-08 |
| R-U4-04 | 信頼性 | 冪等投稿 | NFR-U4-09 |
| S-U4-01 | セキュリティ | オンデマンド認証情報 | NFR-U4-10, NFR-U4-13 |
| S-U4-02 | セキュリティ | HTMLサニタイズ | NFR-U4-11 |
| S-U4-03 | セキュリティ | セキュア通信 | NFR-U4-12, NFR-U4-13 |
| A-U4-01 | ユーザビリティ | アクセシブルダイアログ | NFR-U4-15 |
| A-U4-02 | ユーザビリティ | 構造化エラーメッセージ | NFR-U4-14 |
| A-U4-03 | ユーザビリティ | トースト通知 | NFR-U4-21 |
| M-U4-01 | 保守性 | アダプターレジストリ | NFR-U4-16 |
| M-U4-02 | 保守性 | テスタブルAPIクライアント | NFR-U4-17 |

---

## パフォーマンスパターン

### P-U4-01: 非同期パイプラインパターン

**対応NFR**: NFR-U4-05（進捗フィードバック200ms）, NFR-U4-20（パイプラインタイムアウト300秒）

**概要**: 投稿フローの7ステップを非同期パイプラインとして実装。各ステップ完了ごとにコールバックでStore層に通知しUIに反映。

```typescript
// 進捗コールバック型（Store層から注入）
type ProgressCallback = (progress: PublishProgress) => void

class PublishPipeline {
  private abortController: AbortController
  private progress: PublishProgress
  private onProgress: ProgressCallback

  async execute(
    payload: ArticlePayload,
    adapter: PlatformAdapter,
    onProgress: ProgressCallback,
  ): Promise<PublishResult> {
    this.onProgress = onProgress
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // パイプライン全体タイムアウト（NFR-U4-20: 300秒）
    const timeoutId = setTimeout(() => this.abortController.abort('timeout'), 300_000)

    // NFR-U4-18: リクエスト数カウント（30リクエスト/投稿上限）
    let requestCount = 0
    const countRequest = () => { requestCount++ }

    try {
      await this.step('validate', () => this.validate(payload), signal)
      await this.step('export', () => this.export(payload), signal)
      const uploadResult = await this.step('upload-images', () => this.uploadImages(payload, adapter, signal, countRequest), signal)
      const finalBody = await this.step('replace-urls', () => this.replaceUrls(payload.body, uploadResult), signal)
      const result = await this.step('publish', () => this.publish(finalBody, adapter, signal, countRequest), signal)
      await this.step('update-frontmatter', () => this.updateFrontmatter(result), signal)
      this.completeStep('complete')
      return result
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async step<T>(name: PublishStep, fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) throw new PublishCancelledError()
    this.updateProgress(name)
    return fn()
  }

  private updateProgress(step: PublishStep): void {
    this.progress = { ...this.progress, currentStep: step, completedSteps: this.progress.completedSteps + 1 }
    this.onProgress(this.progress)  // コールバックでStore層に通知（循環依存を回避）
  }
}
```

**ポイント**:
- 各ステップは独立したasync関数。ステップ間でAbortSignalをチェック
- Store更新はコールバック経由（循環依存を回避。publishStore.svelte.tsが$stateを管理）
- エラーはステップ名付きでthrow → PublishErrorとしてキャッチ
- NFR-U4-18: requestCountで投稿あたりのAPIリクエスト数を追跡（14画像超で警告、30上限）

---

### P-U4-02: 遅延初期化パターン

**対応NFR**: NFR-U4-04（起動140ms以内）

**概要**: プラットフォーム接続テストとトークン検証を起動クリティカルパスから除外し、バックグラウンドで実行。

```typescript
// app-init.ts（U4追加分）
export async function initializePlatformIntegration(): Promise<void> {
  // クリティカルパス（140ms以内）
  const registry = new PlatformAdapterRegistry()
  registry.register(new ZennAdapter())                     // [10ms]
  await platformStore.loadConnections()              // [40ms] トークン有無のみ確認
  const exportService = new ExportService()                 // [10ms]
  const imageManager = new ImageManager()                   // [10ms]
  const publishService = new PublishService(registry, exportService, imageManager)  // [10ms]
  registerSlashCommands(['/export', '/image', '/publish'])  // [30ms]
  // 合計: ~110ms

  // 非クリティカル（バックグラウンド — 起動完了後に非同期実行）
  queueMicrotask(async () => {
    for (const adapter of registry.getAll()) {
      if (platformStore.hasCredentials(adapter.platformId)) {
        const result = await adapter.testConnection()
        platformStore.updateConnectionStatus(adapter.platformId, result)
      }
    }
  })
}
```

**ポイント**:
- `loadConnections()`: SecureStorageからトークンの有無のみ確認（トークン値は読み込まない）
- 接続テストはバックグラウンド。結果は`platformStore.connections`に反映
- 起動直後に投稿ボタンを押された場合: 接続テスト未完了でも`hasCredentials`がtrueなら投稿開始可能

---

### P-U4-03: 進捗ストリーミングパターン

**対応NFR**: NFR-U4-05（進捗200ms以内更新）

**概要**: 画像アップロード中の進捗をリアルタイムでUIに反映。

```typescript
async uploadImages(
  images: LocalImageRef[],
  adapter: PlatformAdapter,
  signal: AbortSignal,
  countRequest: () => void,
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = []

  // 動的totalSteps更新（画像なしの場合はスキップ）
  if (images.length === 0) return results

  for (let i = 0; i < images.length; i++) {
    if (signal.aborted) throw new PublishCancelledError()

    // 進捗更新（各画像ごと — コールバック経由でUI反映）
    this.onProgress({
      ...this.progress,
      imageProgress: {
        total: images.length,
        completed: i,
        currentFile: images[i].localPath,
        failedFiles: results.filter(r => !r.success).map(r => r.localPath),
      }
    })

    try {
      // NOTE: PlatformAdapter.uploadImage(image, signal?) — C4インターフェース拡張が必要
      // AbortSignalをアダプター経由でfetchまで伝播
      const result = await adapter.uploadImage(images[i], signal)
      countRequest()  // NFR-U4-18: リクエスト数カウント
      results.push(result)
    } catch (error) {
      results.push({ localPath: images[i].localPath, remoteUrl: '', success: false, error: String(error) })
    }
  }

  return results
}
```

---

### P-U4-04: バンドル最適化パターン

**対応NFR**: NFR-U4-19（バンドルサイズ50KB以下）

**概要**: gray-matterとDOMPurifyを動的importで遅延読み込み。起動時のJSバンドルに含めない。

```typescript
// frontmatter-utils.ts
let _matter: typeof import('gray-matter') | null = null

async function getMatter() {
  if (!_matter) {
    const mod = await import('gray-matter')
    _matter = mod.default || mod
  }
  return _matter
}

export async function parseFrontmatter(content: string) {
  const matter = await getMatter()
  return matter(content, {
    engines: { yaml: { parse: yaml.load, stringify: yaml.dump } }
  })
}

// html-sanitizer.ts
let _DOMPurify: typeof import('dompurify') | null = null

async function getDOMPurify() {
  if (!_DOMPurify) {
    // NOTE: DOMPurifyはDOM環境が必要。Vitest環境ではvitest.config.tsで
    // environment: 'jsdom' を設定すること（tech-stack-decisions.md参照）
    if (typeof window === 'undefined') {
      throw new Error('DOMPurify requires a DOM environment. Configure jsdom in vitest.config.ts.')
    }
    const mod = await import('dompurify')
    _DOMPurify = mod.default || mod
  }
  return _DOMPurify
}

export async function sanitizeHTML(html: string): Promise<string> {
  const DOMPurify = await getDOMPurify()
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
```

**ポイント**:
- 初回呼び出し時のみ動的import。2回目以降はキャッシュ済みモジュールを使用
- 起動時のバンドルサイズへの影響をゼロに

---

### P-U4-05: キャンセラブルパイプラインパターン

**対応NFR**: NFR-U4-20（パイプラインタイムアウト300秒）

**概要**: AbortControllerで投稿パイプラインをいつでもキャンセル可能にする。進行中のfetch呼び出しも中断。

```typescript
class PublishPipeline {
  private abortController: AbortController | null = null

  cancel(): void {
    this.abortController?.abort('user-cancelled')
  }

  // GitHubApiClientにsignalを伝播
  private async publish(body: string, adapter: PlatformAdapter, signal: AbortSignal): Promise<PublishResult> {
    // adapter内部でfetch呼び出し時にsignalを渡す
    return adapter.publishDraft({ ...payload, body }, signal)
  }
}

// GitHubApiClient — signal伝播
class GitHubApiClientImpl {
  private async fetch<T>(endpoint: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(15_000),
      headers: { ... },
    })
    // ...
  }
}

// UI側（publishStore.svelte.ts内）
function handleCancel() {
  publishPipeline.cancel()
  // publishStore内で$stateを直接更新（.svelte.tsファイルなので$stateが有効）
  progress = { ...progress, status: 'idle' }
}
```

**ポイント**:
- AbortControllerのsignalをパイプライン全体→各ステップ→fetch呼び出しまで伝播
- キャンセル時: 進行中のHTTPリクエストも即座に中断（ブラウザがTCP接続をクローズ）
- UIの「キャンセル」ボタンは投稿中常に表示

---

## 信頼性パターン

### R-U4-01: オフラインファーストパターン

**対応NFR**: NFR-U4-06（オフラインエクスポート）, NFR-U4-07（ネットワーク障害検出）

```typescript
// network-status.ts
class NetworkStatus {
  isOnline = $state<boolean>(navigator.onLine)

  constructor() {
    window.addEventListener('online', () => { this.isOnline = true })
    window.addEventListener('offline', () => { this.isOnline = false })
  }

  // 投稿前のプリフライトチェック
  async checkConnectivity(adapter: PlatformAdapter): Promise<boolean> {
    if (!this.isOnline) return false
    try {
      await adapter.testConnection()
      return true
    } catch {
      return false
    }
  }
}

export const networkStatus = new NetworkStatus()

// ExportService — オフラインでも動作
export class ExportService {
  // ローカル変換のみ。外部依存なし
  toMarkdown(doc: ProseMirrorDoc): string { /* ... */ }
  toHTML(doc: ProseMirrorDoc): string { /* ... */ }
}

// PublishButton — オンライン状態で制御
// <button disabled={!networkStatus.isOnline || !platformStore.isConnected(platformId)}>
```

---

### R-U4-02: リトライダイアログパターン

**対応NFR**: NFR-U4-07（ネットワーク障害）, NFR-U4-08（部分失敗リカバリ）

```typescript
// publish-error-handler.ts
function handlePublishError(error: PublishError): void {
  if (error.retryable) {
    // リトライダイアログ表示
    showRetryDialog({
      title: '投稿に失敗しました',
      message: formatErrorMessage(error),  // A-U4-02パターン適用
      step: error.step,
      actions: [
        { label: '再試行', action: () => retryFromStep(error.step) },
        { label: 'キャンセル', action: () => cancelPublish() },
      ]
    })
  } else {
    // リトライ不可 — エラー通知のみ
    notificationStore.show('error', formatErrorMessage(error))
  }
}

// レート制限専用ハンドラ
function handleRateLimitError(resetTimestamp: number): void {
  const waitSeconds = Math.ceil((resetTimestamp * 1000 - Date.now()) / 1000)
  showRetryDialog({
    title: 'GitHub APIレート制限',
    message: `レート制限中です。${waitSeconds}秒後に再試行可能になります。`,
    countdown: waitSeconds,  // カウントダウン表示
    actions: [
      { label: '自動再試行', action: () => waitAndRetry(waitSeconds) },
      { label: 'キャンセル', action: () => cancelPublish() },
    ]
  })
}
```

---

### R-U4-03: 部分失敗リカバリパターン

**対応NFR**: NFR-U4-08

```typescript
// 画像アップロード部分失敗時のリカバリフロー
async function handlePartialImageFailure(
  results: ImageUploadResult[],
  signal: AbortSignal
): Promise<'retry' | 'continue' | 'cancel'> {
  const failed = results.filter(r => !r.success)
  const succeeded = results.filter(r => r.success)

  if (failed.length === 0) return 'continue'

  // 成功分のURL置換マップを保持（リトライ時にスキップ）
  const uploadedMap = new Map(succeeded.map(r => [r.localPath, r.remoteUrl]))

  const choice = await showRetryDialog({
    title: `画像アップロード: ${failed.length}件失敗`,
    message: `${results.length}件中${succeeded.length}件成功、${failed.length}件失敗`,
    failedFiles: failed.map(f => f.localPath),
    actions: [
      { label: '失敗分を再試行', value: 'retry' },
      { label: 'このまま投稿（失敗画像はローカルパスのまま）', value: 'continue' },
      { label: 'キャンセル', value: 'cancel' },
    ]
  })

  return choice
}
```

**ポイント**:
- 成功済み画像のリモートURLは保持。リトライ時にスキップ
- 元のエディター内容は一切変更しない（URL置換は投稿用コピーに対して実行）

---

### R-U4-04: 冪等投稿パターン

**対応NFR**: NFR-U4-09

```typescript
// frontmatterからPublishRecordを読み取り、既存投稿を検出
async function checkExistingPublish(
  filePath: string,
  platformId: string
): Promise<PublishRecord | null> {
  const content = await fsAdapter.readFile(filePath)
  const { data } = await parseFrontmatter(content)
  const records: PublishRecord[] = data.publish_records ?? []
  return records.find(r => r.platformId === platformId) ?? null
}

// 二重送信防止（PublishService内に組み込み — publish.ts）
// NOTE: publishStore.svelte.ts側で$state<boolean>としてisPublishing状態を公開
class PublishGuard {
  private _isPublishing = false

  get isPublishing(): boolean { return this._isPublishing }

  async withGuard<T>(fn: () => Promise<T>): Promise<T> {
    if (this._isPublishing) throw new Error('投稿処理が進行中です')
    this._isPublishing = true
    try {
      return await fn()
    } finally {
      this._isPublishing = false
    }
  }
}
```

---

## セキュリティパターン

### S-U4-01: オンデマンド認証情報パターン

**対応NFR**: NFR-U4-10（認証情報保護）, NFR-U4-13（ログ出力抑制）

**方式**: 投稿操作開始時にSecureStorageから1回取得し、操作完了後に参照を解放。

```typescript
// credential-manager.ts
class CredentialManager {
  // 認証情報はメモリに常駐させない
  async withCredentials<T>(
    platformId: string,
    fn: (credentials: PlatformCredentials) => Promise<T>
  ): Promise<T> {
    // 操作開始時に取得
    const credentials = await settingsManager.getPlatformCredentials(platformId)
    if (!credentials) throw new Error('認証情報が設定されていません')

    try {
      return await fn(credentials)
    } finally {
      // 操作完了後: 参照をnullに（GC対象化）
      // JSではメモリの明示的ゼロ化は不可能だが、保持時間を最小化
    }
  }
}

// 使用例
await credentialManager.withCredentials('zenn', async (creds) => {
  const client = new GitHubApiClientImpl(
    (creds as ZennCredentials).githubToken,
    (creds as ZennCredentials).repositoryOwner,
    (creds as ZennCredentials).repositoryName,
    (creds as ZennCredentials).branch,
  )
  const adapter = new ZennAdapter(client)  // GitHubApiClientをPlatformAdapterでラップ
  return await publishPipeline.execute(payload, adapter, onProgress)
})
// ここで credentials, client, adapter は全てスコープ外 → GC対象
```

---

### S-U4-02: HTMLサニタイズパターン

**対応NFR**: NFR-U4-11

```typescript
// html-sanitizer.ts
import type DOMPurifyType from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'code', 'pre', 'blockquote', 'a', 'img',
  'em', 'strong', 'del', 'hr', 'br', 'input',
  'div', 'span', 'figure', 'figcaption',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'type', 'checked', 'align', 'data-language',
]

// 遅延読み込み（P-U4-04）
let _purify: typeof DOMPurifyType | null = null

export async function sanitizeHTML(html: string): Promise<string> {
  if (!_purify) {
    const mod = await import('dompurify')
    _purify = mod.default || mod
  }
  return _purify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
```

---

### S-U4-03: セキュア通信パターン

**対応NFR**: NFR-U4-12（HTTPS必須）, NFR-U4-13（ログ出力抑制）

```typescript
// github-api-client.ts
class GitHubApiClientImpl {
  private async fetch<T>(endpoint: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
    const url = `https://api.github.com${endpoint}`

    // HTTPS検証（NFR-U4-12）
    if (!url.startsWith('https://')) {
      throw new SecurityError('HTTPS以外の通信は許可されていません')
    }

    // ログ出力時のマスク（NFR-U4-13）
    console.debug(`[GitHubAPI] ${options?.method ?? 'GET'} ${endpoint}`)
    // ❌ ログにトークンを含めない
    // ❌ console.debug('Authorization:', this.token)

    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(15_000),
      headers: {
        'Authorization': `Bearer ${this.token}`,  // ヘッダーには含めるがログには出さない
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      // エラーログにもトークンを含めない
      console.error(`[GitHubAPI] ${response.status} ${response.statusText} for ${endpoint}`)
      throw new GitHubApiError(response)
    }

    return response.json()
  }
}
```

---

## ユーザビリティパターン

### A-U4-01: アクセシブルダイアログパターン

**対応NFR**: NFR-U4-15（WCAG 2.1 AAA）

```svelte
<!-- PublishDialog.svelte -->
<dialog
  bind:this={dialogEl}
  role="dialog"
  aria-modal="true"
  aria-labelledby="publish-dialog-title"
  onclose={handleClose}
>
  <h2 id="publish-dialog-title">記事を投稿</h2>

  <!-- フォーカストラップ: U3 FocusTrap ユーティリティを再利用 -->
  <FocusTrap active={isOpen}>
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <label for="publish-title">タイトル</label>
      <input id="publish-title" bind:value={title} required aria-required="true" />

      <label for="publish-tags">トピック</label>
      <input id="publish-tags" bind:value={tagsInput} aria-describedby="tags-help" />
      <span id="tags-help" class="sr-only">カンマ区切りで最大5個</span>

      <!-- ... other fields ... -->

      <div role="group" aria-label="アクション">
        <button type="button" onclick={handleClose}>キャンセル</button>
        <button type="submit" disabled={isPublishing || !isValid}>
          {isPublishing ? '投稿中...' : publishAs === 'draft' ? '下書き保存' : '公開'}
        </button>
      </div>
    </form>
  </FocusTrap>
</dialog>
```

---

### A-U4-02: 構造化エラーメッセージパターン

**対応NFR**: NFR-U4-14（エラーメッセージ3要素）

```typescript
// error-messages.ts
interface UserFriendlyError {
  what: string    // 何が起きたか
  why: string     // なぜ起きたか
  action: string  // どうすればいいか
}

const ERROR_MAP: Record<string, (details?: string) => UserFriendlyError> = {
  'github-401': () => ({
    what: 'Zennへの投稿に失敗しました',
    why: 'GitHub Tokenが無効または期限切れです',
    action: '設定画面からトークンを更新してください',
  }),
  'github-404': () => ({
    what: 'Zennリポジトリが見つかりません',
    why: '設定されたリポジトリが存在しないか、アクセス権がありません',
    action: '設定画面でリポジトリ名を確認してください',
  }),
  'github-409': () => ({
    what: '記事ファイルの更新に競合が発生しました',
    why: '他の場所（Zenn CLI等）から同じ記事が更新されています',
    action: '再試行してください。問題が続く場合はZenn上で記事を確認してください',
  }),
  'github-rate-limit': (resetTime) => ({
    what: 'GitHub APIのレート制限に達しました',
    why: '短時間に多くのリクエストを送信しました',
    action: `${resetTime}後に再試行可能です`,
  }),
  'network-error': () => ({
    what: '通信エラーが発生しました',
    why: 'インターネット接続が不安定です',
    action: 'ネットワーク接続を確認して再試行してください',
  }),
  'image-upload-failed': (filename) => ({
    what: `画像のアップロードに失敗しました: ${filename}`,
    why: 'ネットワークエラーまたはファイルサイズ超過の可能性があります',
    action: '再試行するか、画像を小さくしてからお試しください',
  }),
}

export function formatErrorMessage(error: PublishError): string {
  const key = classifyError(error)
  const msg = ERROR_MAP[key]?.(error.details)
  if (!msg) return `エラーが発生しました: ${error.message}`
  return `${msg.what}\n${msg.why}\n${msg.action}`
}
```

---

### A-U4-03: トースト通知パターン

**対応NFR**: NFR-U4-21（通知タイミング）

```typescript
// notification-store.svelte.ts
class NotificationStore {
  notifications = $state<Notification[]>([])
  private nextId = 0

  private readonly DURATIONS: Record<Notification['type'], number> = {
    success: 3000,
    info: 3000,
    warning: 5000,
    error: 0,  // 手動消去のみ
  }

  show(type: Notification['type'], message: string): void {
    const id = String(this.nextId++)
    const duration = this.DURATIONS[type]

    this.notifications = [...this.notifications, { id, type, message, duration }]

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration)
    }
  }

  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id)
  }
}
```

```svelte
<!-- NotificationToast.svelte -->
<div class="toast-container" aria-live="polite" aria-relevant="additions removals">
  {#each notificationStore.notifications as notification (notification.id)}
    <div
      class="toast toast-{notification.type}"
      role={notification.type === 'error' ? 'alert' : 'status'}
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <span class="toast-message">{notification.message}</span>
      <button
        class="toast-close"
        onclick={() => notificationStore.dismiss(notification.id)}
        aria-label="通知を閉じる"
      >×</button>
    </div>
  {/each}
</div>
```

---

## 保守性パターン

### M-U4-01: アダプターレジストリパターン

**対応NFR**: NFR-U4-16（アダプター拡張性）

```typescript
// platform-adapter-registry.ts
class PlatformAdapterRegistry {
  private adapters = new Map<string, PlatformAdapter>()

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platformId, adapter)
  }

  get(platformId: string): PlatformAdapter | undefined {
    return this.adapters.get(platformId)
  }

  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values())
  }

  getConnected(): PlatformAdapter[] {
    return this.getAll().filter(a =>
      platformStore.isConnected(a.platformId)
    )
  }
}

// Post-MVP拡張例:
// registry.register(new NoteAdapter())      // note追加
// registry.register(new MicroCMSAdapter())  // microCMS追加
// → PublishService, UIコンポーネントの変更は不要
```

---

### M-U4-02: テスタブルAPIクライアントパターン

**対応NFR**: NFR-U4-17（テスタビリティ ≥80%カバレッジ）

```typescript
// github-api-client.ts — インターフェース定義
interface GitHubApiClient {
  getFile(path: string): Promise<GitHubFileResponse>
  createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<GitHubCommitResponse>
  getRateLimit(): Promise<GitHubRateLimitResponse>
  testAuth(): Promise<boolean>
}

// 本番実装
class GitHubApiClientImpl implements GitHubApiClient { /* ... */ }

// テスト用モック
class MockGitHubApiClient implements GitHubApiClient {
  private files = new Map<string, { content: string; sha: string }>()

  async getFile(path: string): Promise<GitHubFileResponse> {
    const file = this.files.get(path)
    if (!file) throw new GitHubApiError({ status: 404 })
    return { path, content: btoa(file.content), sha: file.sha }
  }

  async createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<GitHubCommitResponse> {
    // 契約テスト: レスポンススキーマを検証
    const newSha = crypto.randomUUID()
    this.files.set(path, { content, sha: newSha })
    return { content: { path, sha: newSha }, commit: { message } }
  }

  // テスト用ヘルパー
  seedFile(path: string, content: string, sha: string): void {
    this.files.set(path, { content, sha })
  }
}

// ZennAdapterのテスト
describe('ZennAdapter', () => {
  let adapter: ZennAdapter
  let mockClient: MockGitHubApiClient

  beforeEach(() => {
    mockClient = new MockGitHubApiClient()
    adapter = new ZennAdapter(mockClient)  // DI
  })

  it('publishes a draft article', async () => {
    const result = await adapter.publishDraft(payload)
    expect(result.success).toBe(true)
    expect(result.articleId).toMatch(/^[a-z0-9]{12}$/)
  })
})
```

**契約テスト**: モックレスポンスがGitHub API仕様に準拠しているか、テスト内でスキーマ検証。

```typescript
// github-api-schemas.ts
const GitHubFileResponseSchema = z.object({
  path: z.string(),
  content: z.string(),
  sha: z.string(),
  encoding: z.literal('base64').optional(),
})

// テスト内で使用
expect(() => GitHubFileResponseSchema.parse(response)).not.toThrow()
```

---

## コード生成時のインターフェース更新メモ

NFR設計で判明した、Application Design `component-methods.md` への必要な更新:

| 対象 | 変更内容 | 理由 |
|---|---|---|
| C4 `PlatformAdapter.uploadImage` | `uploadImage(image: LocalImageRef, signal?: AbortSignal): Promise<ImageUploadResult>` | P-U4-05: AbortSignal伝播、型をLocalImageRefに統一 |
| C5 `ImageManager.uploadForPlatform` | `uploadForPlatform(images: LocalImageRef[], adapter: PlatformAdapter): Promise<ImageUploadResult[]>` | domain-entities.mdのLocalImageRef型に合わせる |
| C7 `SettingsManager.getPlatformCredentials` | `getPlatformCredentials(platformId: string): Promise<PlatformCredentials \| undefined>` | S-U4-01: SecureStorage (Stronghold) の非同期アクセスに対応 |

**NOTE**: これらの更新はCode Generation時に実施する。
