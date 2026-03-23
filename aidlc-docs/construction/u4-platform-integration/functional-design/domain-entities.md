# U4 Platform Integration — ドメインエンティティ

## エンティティ一覧

| エンティティ | 責務 | ライフサイクル |
|---|---|---|
| PlatformConnection | プラットフォーム接続情報 | アプリ永続 |
| ArticlePayload | 投稿用記事データ | 投稿操作中のみ |
| PublishRecord | 投稿履歴（frontmatter） | ファイル永続 |
| ImageAsset | 画像アセット | ワークスペース永続 |
| PublishResult | 投稿結果 | 投稿操作後 |
| PublishProgress | 投稿進捗状態 | 投稿操作中のみ |

---

## PlatformConnection

プラットフォームとの接続情報を管理するエンティティ。

```typescript
interface PlatformConnection {
  platformId: string           // 'zenn' | 'note' | 'microcms' | 'contentful'
  platformName: string         // 表示名
  isConnected: boolean         // 接続状態
  supportsDirectPublish: boolean // API投稿をサポートするか

  // Zenn GitHub連携固有
  credentials: ZennCredentials | GenericApiCredentials

  // 接続テスト結果
  lastTestResult?: ConnectionTestResult
  lastTestedAt?: string        // ISO 8601
}

interface ZennCredentials {
  type: 'zenn-github'
  githubToken: string          // GitHub Personal Access Token
  repositoryOwner: string      // GitHubユーザー名/Org名
  repositoryName: string       // Zenn用リポジトリ名（例: 'zenn-content'）
  branch: string               // デフォルト: 'main'（空文字列の場合は保存時に'main'を自動設定）
}

interface GenericApiCredentials {
  type: 'api-key'
  apiKey: string
  apiEndpoint?: string         // microCMS/Contentful用
  spaceId?: string             // Contentful用
  serviceId?: string           // microCMS用
}

// ConnectionTestResult — component-methods.md の定義を拡張（testedAt追加）
interface ConnectionTestResult {
  success: boolean
  message: string
  testedAt?: string            // ISO 8601（U4拡張フィールド）
}

// PlatformCredentials 型定義（component-methods.md C4/C7で参照される共通型）
type PlatformCredentials = ZennCredentials | GenericApiCredentials
```

---

## ArticlePayload

投稿操作時に組み立てられる記事データ。

```typescript
interface ArticlePayload {
  // メタデータ
  title: string
  slug?: string                // Zenn: URLスラッグ
  tags: string[]               // Zenn: topics
  category?: string
  publishAs: 'draft' | 'public'
  articleType?: 'tech' | 'idea' // Zenn固有

  // コンテンツ
  body: string                 // Markdown本文
  bodyFormat: 'markdown' | 'html'

  // 画像（※Application Design component-methods.md の `images` を拡張）
  images: LocalImageRef[]     // 投稿時にアップロードが必要なローカル画像

  // 更新時
  existingArticleId?: string   // 既存記事の更新時に指定
}

interface LocalImageRef {
  localPath: string            // ワークスペース内の相対パス
  markdownRef: string          // Markdown内での参照文字列（例: ./article.assets/img-001.png）
  mimeType: string             // image/png, image/jpeg, etc.
  sizeBytes: number
}
```

---

## PublishRecord

各Markdownファイルのfrontmatterに埋め込まれる投稿履歴。

```typescript
interface PublishRecord {
  platformId: string           // 'zenn'
  articleId: string            // プラットフォーム上の記事ID/slug
  articleUrl?: string          // 投稿後の記事URL
  publishedAt: string          // ISO 8601
  updatedAt?: string           // 最終更新日時
  status: 'draft' | 'published'
}

// frontmatter形式の例（Zenn互換）:
// ---
// title: "記事タイトル"
// emoji: "📝"
// type: "tech"
// topics: ["svelte", "typescript"]
// published: false
// publish_records:
//   - platform: zenn
//     slug: "my-article-slug"
//     url: "https://zenn.dev/user/articles/my-article-slug"
//     published_at: "2026-03-23T10:00:00Z"
// ---
```

---

## ImageAsset

ワークスペース内に保存される画像アセット。

```typescript
interface ImageAsset {
  // ファイル情報
  localPath: string            // ワークスペース内相対パス（例: article.assets/screenshot-20260323-001.png）
  originalName: string         // 元のファイル名
  generatedName: string        // 生成されたファイル名
  mimeType: string             // image/png, image/jpeg, image/gif, image/webp, image/svg+xml
  sizeBytes: number
  createdAt: string            // ISO 8601

  // アップロード状態
  uploadStatus: ImageUploadStatus
  remoteUrl?: string           // アップロード後のURL
}

type ImageUploadStatus = 'local' | 'uploading' | 'uploaded' | 'failed'

// ImageInsertResult — Application Design component-methods.md の定義を拡張
// 元: { success, localPath?, error? }
// 拡張: localPath を保持しつつ asset と markdownRef を追加
interface ImageInsertResult {
  success: boolean
  localPath?: string           // component-methods.md 互換フィールド
  asset?: ImageAsset           // 詳細な画像情報
  markdownRef?: string         // エディターに挿入するMarkdown参照（例: ![alt](./article.assets/img.png)）
  error?: string
}
```

---

## PublishResult

投稿操作の結果を表すエンティティ（component-methods.md 共通型定義と同一）。

```typescript
interface PublishResult {
  success: boolean
  articleId?: string           // プラットフォーム上の記事ID
  articleUrl?: string          // 投稿後の記事URL
  error?: string
}

type ExportFormat = 'markdown' | 'html' | 'zenn-markdown'

interface ExportResult {
  success: boolean
  format: ExportFormat
  method: 'clipboard' | 'file'
  error?: string
}
```

---

## PublishProgress

投稿操作の進捗状態を管理するエンティティ。

```typescript
interface PublishProgress {
  status: PublishStatus
  currentStep: PublishStep
  totalSteps: number
  completedSteps: number

  // 画像アップロード進捗
  imageProgress?: {
    total: number
    completed: number
    currentFile: string
    failedFiles: string[]
  }

  // エラー情報
  error?: PublishError
}

type PublishStatus = 'idle' | 'preparing' | 'uploading-images' | 'publishing' | 'success' | 'failed'

type PublishStep =
  | 'validate'           // 入力バリデーション
  | 'export'             // フォーマット変換
  | 'upload-images'      // 画像アップロード
  | 'replace-urls'       // 画像URL置換
  | 'publish'            // 記事投稿
  | 'update-frontmatter' // frontmatter更新
  | 'complete'           // 完了

interface PublishError {
  step: PublishStep
  message: string
  retryable: boolean
  details?: string
}
```

---

## エンティティ間リレーションシップ

```
+-------------------+       +-------------------+
| PlatformConnection|       |   ArticlePayload  |
| (永続)            |       | (投稿操作中)      |
+-------------------+       +-------------------+
        |                       |           |
        | 認証情報を提供        | 本文参照   | 画像一覧
        v                       v           v
+-------------------+   +-----------+  +-------------+
| ZennAdapter       |   | EditorCore|  | ImageAsset  |
| (実行時)          |   | (実行時)  |  | (永続)      |
+-------------------+   +-----------+  +-------------+
        ^                                   ^
        | アップロード/投稿                 | 管理
        |                                   |
+-------------------+              +-------------------+
| PublishService    |              |   ImageManager    |
| (オーケストレーション)           | (画像操作)       |
+-------------------+              +-------------------+
        |
        | 進捗管理              +-------------------+
        v                       | PublishRecord     |
+-------------------+           | (frontmatter永続) |
| PublishProgress   |           +-------------------+
| (投稿操作中)     |                   ^
+-------------------+                   | 投稿後更新
                                        |
                                +-------------------+
                                | PublishService    |
                                +-------------------+
```

**データフローサマリー**:
1. **投稿フロー**: EditorCore → ExportService → ImageManager(アップロード) → PlatformAdapter(投稿) → PublishRecord(frontmatter更新)
2. **画像挿入フロー**: ユーザー操作(D&D/ペースト) → ImageManager → ImageAsset(ローカル保存) → EditorCore(Markdown挿入)
3. **エクスポートフロー**: EditorCore → ExportService → ExportRequest → クリップボード/ファイル
