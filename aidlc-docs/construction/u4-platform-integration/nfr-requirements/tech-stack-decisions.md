# U4 Platform Integration — Tech Stack Decisions

## 既存Tech Stack（U1/U2/U3から継承）

| カテゴリ | 技術 | 備考 |
|---|---|---|
| フレームワーク | Svelte 5 (runes) | $state/$derived/$props |
| デスクトップ | Tauri 2.x | プラグイン体系 |
| ファイルI/O | @tauri-apps/plugin-fs | FileSystemAdapter経由 |
| セキュア保存 | @tauri-apps/plugin-stronghold | 認証情報 |
| ダイアログ | @tauri-apps/plugin-dialog | ファイル/フォルダ選択 |
| 設定管理 | SettingsManager (U1) | JSON永続化 |
| エディター | Tiptap 3.x | EditorCore (U2) |
| テスト | Vitest + @testing-library/svelte | 既存テスト基盤 |

## U4で追加する技術

### GitHub API クライアント: 軽量自前実装（fetch API ベース）

**選定理由**:
- U4で使用するGitHub APIは Contents API（ファイルCRUD）と Rate Limit API のみ
- Octokit（@octokit/rest）はバンドルサイズ約50KB+ で、使用APIの割に過剰
- fetch API ベースの薄いラッパーで十分（認証ヘッダー付与、エラーハンドリング、レスポンス型定義）
- Tauri / Web両環境でfetchが利用可能

**不採用案**:
- `@octokit/rest`: フル機能だがバンドルサイズ大、使用する機能に対して過剰
- `@octokit/core`: 軽量版だがそれでも追加依存が増える

**実装方針**:
```typescript
// src/lib/integration/platform/github-api-client.ts
interface GitHubApiClient {
  // ファイル操作（Contents API）
  getFile(path: string): Promise<GitHubFileResponse>
  createOrUpdateFile(path: string, content: string, message: string, sha?: string): Promise<GitHubCommitResponse>

  // ヘルスチェック
  getRateLimit(): Promise<GitHubRateLimitResponse>

  // 認証テスト
  testAuth(): Promise<boolean>
}

class GitHubApiClientImpl implements GitHubApiClient {
  constructor(
    private token: string,
    private owner: string,
    private repo: string,
    private branch: string
  ) {}

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `https://api.github.com${endpoint}`
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15_000), // NFR-U4-07: 15秒タイムアウト
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!response.ok) throw new GitHubApiError(response)
    return response.json()
  }
}
```

---

### frontmatterパーサー: gray-matter

**選定理由**:
- Zenn CLIと同じライブラリで、Zenn frontmatter形式との互換性が保証される
- Markdown+frontmatterを一体的にパース（content/data分離）
- シリアライズ（data → frontmatter文字列変換）もサポート
- 広く使われており（週500万DL+）、安定している
- バンドルサイズ: 約12KB (minified)
- **注意**: gray-matter 4.xは内部で`js-yaml` 3.xを使用。`engines`オプションで`js-yaml` 4.xに差し替えてセキュリティリスクを軽減する:
  ```typescript
  import matter from 'gray-matter'
  import yaml from 'js-yaml'
  // js-yaml 4.xを明示的に使用（gray-matter内蔵のjs-yaml 3.xを上書き）
  matter(content, { engines: { yaml: { parse: yaml.load, stringify: yaml.dump } } })
  ```
- 依存パッケージに`js-yaml` ^4.xを追加し、gray-matter内蔵の3.xを使用しない

**不採用案**:
- `yaml`（js-yaml後継）: YAMLパースのみでMarkdown分離機能がない。gray-matterの内部でjs-yamlを使用しているため二重依存になる
- 自前パーサー: `---` で分割してYAMLパースするだけだが、エッジケース（`---`が本文中に出現等）の対応が面倒

**使用パターン**:
```typescript
import matter from 'gray-matter'

// パース
const { content, data } = matter(markdownWithFrontmatter)
// data.title, data.topics, data.publish_records 等にアクセス

// シリアライズ
const output = matter.stringify(content, {
  title: 'My Article',
  emoji: '📝',
  type: 'tech',
  topics: ['svelte', 'typescript'],
  published: false,
  publish_records: [{ platform: 'zenn', slug: 'abc123' }]
})
```

---

### HTMLサニタイズ: DOMPurify

**選定理由**:
- XSS防止の業界標準ライブラリ
- 高速（大きなHTML文書でも数ms）
- 許可タグ/属性のカスタマイズが容易
- Tiptap生成HTMLは通常安全だが、防御的にサニタイズすることで将来のプラグイン追加時にも安全性を保証
- バンドルサイズ: 約20KB (minified)

**不採用案**:
- `sanitize-html`: Node.js向けが主。ブラウザでの使用は可能だがDOMPurifyよりバンドルサイズが大きい
- サニタイズなし: Tiptap出力が安全であっても、カスタムHTMLやプラグイン経由で不正コンテンツが混入するリスクを排除できない

**使用パターン**:
```typescript
// Vitest環境ではjsdom環境が必要（vitest.config.ts: environment: 'jsdom'）
// または isomorphic-dompurify を使用してSSR/テスト互換性を確保
import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'code', 'pre', 'blockquote', 'a', 'img',
  'em', 'strong', 'del', 'hr', 'br', 'input',
  'div', 'span', 'figure', 'figcaption'
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'type', 'checked', 'align', 'data-language'
]

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}
```

---

### 画像リサイズ/圧縮: MVPでは不実装

**決定**: MVPでは画像の自動リサイズ・圧縮は行わない。元画像をそのままアップロードする。

**理由**:
- MVP対象の画像は主にスクリーンショットや図解（通常1-3MB）で、5MB上限内に収まる
- 画像処理ライブラリ追加はバンドルサイズ増加要因
- GitHub Contents API のファイルサイズ制限は100MBで十分余裕がある
- Post-MVPで必要に応じて追加（候補: `sharp`（Tauri Rust side）or `browser-image-compression`）

---

### クリップボードAPI: Web Clipboard API

**選定理由**:
- `navigator.clipboard.writeText()` でテキスト（Markdown）コピー
- `navigator.clipboard.write([new ClipboardItem(...)])` でリッチテキスト（HTML）コピー
- ブラウザ/Tauri WebView両方で利用可能
- 追加パッケージ不要
- **セキュアコンテキスト必須**: `clipboard.write()`はHTTPS or localhostでのみ動作。Tauri WebViewは常にセキュアコンテキスト。Web版はHTTPS必須（NFR-U4-12と整合）

**使用パターン**:
```typescript
// Markdownコピー
await navigator.clipboard.writeText(markdownContent)

// HTMLコピー（リッチテキスト）
const blob = new Blob([htmlContent], { type: 'text/html' })
const textBlob = new Blob([markdownContent], { type: 'text/plain' })
await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': blob,
    'text/plain': textBlob,  // フォールバック
  })
])
```

---

## 追加パッケージサマリー

| パッケージ | バージョン | サイズ | 用途 |
|---|---|---|---|
| gray-matter | ^4.x | ~12KB | frontmatter パース/シリアライズ |
| js-yaml | ^4.x | ~7KB | gray-matterのYAMLエンジン上書き（3.x→4.x） |
| dompurify | ^3.x | ~20KB | HTMLエクスポート時サニタイズ |

**U4追加パッケージ合計**: 約39KB（minified）。バンドルサイズバジェット50KB以下（NFR-U4-19）

**自前実装**:
| モジュール | 用途 |
|---|---|
| GitHubApiClient | GitHub Contents API + Rate Limit API 呼び出し |
| ImageManager | 画像挿入・ローカル保存・アップロード管理 |
| ExportService | MD/HTML変換・クリップボード/ファイル出力 |
| PublishService | 投稿パイプラインオーケストレーション |

---

## アーキテクチャ統合

### U4コンポーネントのファイル配置

```
src/lib/
  integration/
    platform/
      types.ts                    # PlatformAdapter インターフェース
      platform-adapter-registry.ts # アダプター管理
      github-api-client.ts        # GitHub API 薄ラッパー
      zenn/
        zenn-adapter.ts           # ZennAdapter実装
        zenn-frontmatter.ts       # Zenn frontmatter変換
    export/
      export-service.ts           # ExportService
      html-sanitizer.ts           # DOMPurify ラッパー
      frontmatter-utils.ts        # gray-matter ラッパー
  core/
    image-manager/
      image-manager.ts            # ImageManager
      image-validator.ts          # 画像バリデーション
      image-naming.ts             # ファイル名生成
  services/
    publish.ts                    # PublishService + PublishGuard（拡張）
    publish-pipeline.ts           # PublishPipeline（7ステップ実行）
    credential-manager.ts         # CredentialManager（認証情報管理）
  stores/
    publish-store.svelte.ts       # publishStore
    platform-store.svelte.ts      # platformStore
    image-store.svelte.ts         # imageStore
    notification-store.svelte.ts  # notificationStore
src/components/
  dialogs/
    PublishDialog.svelte
    PlatformSettingsDialog.svelte
    PlatformConnectionCard.svelte
  toolbar/
    ExportMenu.svelte
    PublishButton.svelte
  editor/
    ImageDropOverlay.svelte
  notifications/
    NotificationToast.svelte
```

### 起動時初期化シーケンス

```
app-init.ts（U4追加分）
  |
  +-- PlatformAdapterRegistry.initialize()     [30ms]
  |     +-- ZennAdapter を登録
  |
  +-- platformStore.loadConnections()            [50ms]
  |     +-- SettingsManager から接続情報を読み込み
  |     +-- isConnected フラグを設定（トークン有無のみ確認）
  |
  +-- ExportService.initialize()                 [10ms]
  +-- ImageManager.initialize()                  [10ms]
  +-- PublishService.initialize(registry)         [10ms]
  +-- スラッシュコマンド登録(/export, /image, /publish)  [30ms]
  |
  +-- 非同期（起動後バックグラウンド）:
        +-- 接続テスト実行（各プラットフォーム）
        +-- レート制限状態の事前取得
```

**合計**: 140ms（バジェット内）。接続テストはバックグラウンド。
