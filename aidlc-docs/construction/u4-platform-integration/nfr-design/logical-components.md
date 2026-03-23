# U4 Platform Integration — 論理コンポーネント

## 論理コンポーネント一覧

| ID | コンポーネント | レイヤー | 責務 |
|---|---|---|---|
| LC-U4-01 | GitHubApiClient | Infrastructure | GitHub Contents API呼び出し（fetchラッパー） |
| LC-U4-02 | ZennAdapter | Integration | Zenn GitHub連携（記事投稿・画像アップロード） |
| LC-U4-03 | PlatformAdapterRegistry | Integration | アダプター管理（登録・取得） |
| LC-U4-04 | ImageManager | Core | 画像挿入・ローカル保存・アップロード管理 |
| LC-U4-05 | ExportService | Integration | MD/HTML変換・クリップボード/ファイル出力 |
| LC-U4-06 | PublishPipeline | Service | 投稿7ステップパイプライン実行 |
| LC-U4-07 | PublishService | Service | 投稿オーケストレーション（パイプライン+エクスポート） |
| LC-U4-08 | CredentialManager | Infrastructure | 認証情報のオンデマンド取得・解放 |
| LC-U4-09 | FrontmatterUtils | Utility | gray-matterラッパー（frontmatterパース・シリアライズ） |
| LC-U4-10 | HTMLSanitizer | Utility | DOMPurifyラッパー（HTMLサニタイズ） |
| LC-U4-11 | NetworkStatus | Utility | オンライン/オフライン状態管理 |
| LC-U4-12 | ErrorMessageFormatter | Utility | 構造化エラーメッセージ変換 |
| LC-U4-13 | PublishGuard | Service | 二重送信防止（PublishService内に組み込み） |

---

## レイヤー構成

```
+---------------------------------------------------------------+
|                    Presentation Layer                          |
|  PublishDialog | PlatformSettingsDialog | ExportMenu           |
|  ImageDropOverlay | PublishProgressIndicator | NotificationToast|
+---------------------------------------------------------------+
|                       Store Layer                             |
|  publishStore | platformStore | imageStore | notificationStore |
+---------------------------------------------------------------+
|                      Service Layer                            |
|  LC-U4-07 PublishService                                      |
|    +-- LC-U4-06 PublishPipeline                               |
+---------------------------------------------------------------+
|                       Core Layer                              |
|  LC-U4-04 ImageManager                                        |
+---------------------------------------------------------------+
|                   Integration Layer                           |
|  LC-U4-05 ExportService  |  LC-U4-03 PlatformAdapterRegistry |
|                           |    +-- LC-U4-02 ZennAdapter       |
+---------------------------------------------------------------+
|                  Infrastructure Layer                         |
|  LC-U4-01 GitHubApiClient  |  LC-U4-08 CredentialManager     |
+---------------------------------------------------------------+
|                     Utility Layer                             |
|  LC-U4-09 FrontmatterUtils | LC-U4-10 HTMLSanitizer          |
|  LC-U4-11 NetworkStatus    | LC-U4-12 ErrorMessageFormatter  |
+---------------------------------------------------------------+
```

---

## コンポーネント間依存関係

```
PublishDialog
  |-- publishStore → PublishService (+ PublishGuard)
  |                    |-- PublishPipeline (進捗はコールバック経由で通知)
  |                    |     |-- ExportService → HTMLSanitizer
  |                    |     |-- ImageManager
  |                    |     |-- ZennAdapter → GitHubApiClient
  |                    |     |-- FrontmatterUtils
  |                    |-- CredentialManager → SettingsManager (U1)
  |-- platformStore → SettingsManager (U1)
  |-- NetworkStatus

PlatformSettingsDialog
  |-- platformStore → SettingsManager (U1)
  |-- ZennAdapter → GitHubApiClient (testConnection)

ExportMenu
  |-- publishStore → PublishService (export methods)
  |-- ExportService → HTMLSanitizer

ImageDropOverlay
  |-- imageStore → ImageManager → FileSystemAdapter (U1)
  |-- EditorCore (U2) — Markdown挿入

NotificationToast
  |-- notificationStore
```

---

## ファイル配置計画

```
src/lib/
  integration/
    platform/
      types.ts                        # PlatformAdapter インターフェース
      platform-adapter-registry.ts    # LC-U4-03
      github-api-client.ts            # LC-U4-01
      github-api-schemas.ts           # 契約テスト用スキーマ（zod）
      zenn/
        zenn-adapter.ts               # LC-U4-02
        zenn-frontmatter.ts           # Zenn frontmatter変換ヘルパー
    export/
      export-service.ts               # LC-U4-05
      html-sanitizer.ts               # LC-U4-10
      frontmatter-utils.ts            # LC-U4-09
  core/
    image-manager/
      image-manager.ts                # LC-U4-04
      image-validator.ts              # 画像バリデーション（BR-U4-06/07/08）
      image-naming.ts                 # ファイル名生成（BR-U4-08）
  services/
    publish.ts                        # LC-U4-07 PublishService + LC-U4-13 PublishGuard
    publish-pipeline.ts               # LC-U4-06 PublishPipeline
    credential-manager.ts             # LC-U4-08
  stores/
    publish-store.svelte.ts           # publishStore
    platform-store.svelte.ts          # platformStore
    image-store.svelte.ts             # imageStore
    notification-store.svelte.ts      # notificationStore
  utils/
    network-status.svelte.ts          # LC-U4-11
    error-messages.ts                 # LC-U4-12

src/components/
  dialogs/
    PublishDialog.svelte
    PublishProgressIndicator.svelte
    PlatformSettingsDialog.svelte
    PlatformConnectionCard.svelte
    RetryDialog.svelte                # リトライダイアログ
  toolbar/
    ExportMenu.svelte
    PublishButton.svelte
  editor/
    ImageDropOverlay.svelte
  notifications/
    NotificationToast.svelte

src/lib/integration/platform/zenn/__tests__/
    zenn-adapter.test.ts
    github-api-client.test.ts
src/lib/integration/export/__tests__/
    export-service.test.ts
    html-sanitizer.test.ts
    frontmatter-utils.test.ts
src/lib/core/image-manager/__tests__/
    image-manager.test.ts
    image-validator.test.ts
    image-naming.test.ts
src/lib/services/__tests__/
    publish-pipeline.test.ts
    publish-service.test.ts
    credential-manager.test.ts
src/lib/stores/__tests__/
    publish-store.test.ts
    platform-store.test.ts
    image-store.test.ts
    notification-store.test.ts
src/lib/utils/__tests__/
    network-status.test.ts
    error-messages.test.ts
src/components/__tests__/
    PublishDialog.test.ts
    ExportMenu.test.ts
    ImageDropOverlay.test.ts
    NotificationToast.test.ts
    PlatformSettingsDialog.test.ts
```

---

## 初期化シーケンス

```
app-init.ts
  |
  +-- [U1] Foundation init                        [460ms]
  +-- [U2] EditorCore init                        [200ms]
  +-- [U3] File Management init                   [200ms]
  +-- [U4] Platform Integration init              [≤140ms]
  |     |
  |     +-- PlatformAdapterRegistry()              [10ms]
  |     |     +-- register(ZennAdapter)
  |     |
  |     +-- platformStore.loadConnections() [40ms]
  |     |     +-- SettingsManager から接続メタデータ読み込み
  |     |     +-- トークン有無のみ確認（値は読まない）
  |     |
  |     +-- ExportService()                        [10ms]
  |     +-- ImageManager()                         [10ms]
  |     +-- PublishService(registry, export, image) [10ms]
  |     +-- registerSlashCommands()                [30ms]
  |     |     +-- /export markdown
  |     |     +-- /export html
  |     |     +-- /image
  |     |     +-- /publish
  |     |
  |     合計: ~110ms (バジェット140ms以内)
  |
  +-- [バックグラウンド]
        +-- 接続テスト（各プラットフォーム）
        +-- GitHub API レート制限状態取得
```

---

## NFRカバレッジマトリックス

| NFR ID | パターン | 論理コンポーネント |
|---|---|---|
| NFR-U4-01 | (直接実装) | ExportService |
| NFR-U4-02 | (直接実装) | ImageManager |
| NFR-U4-03 | (直接実装) | PublishDialog, PlatformSettingsDialog |
| NFR-U4-04 | P-U4-02 | app-init (遅延初期化) |
| NFR-U4-05 | P-U4-01, P-U4-03 | PublishPipeline, publishStore |
| NFR-U4-06 | R-U4-01 | ExportService, NetworkStatus |
| NFR-U4-07 | R-U4-01, R-U4-02 | NetworkStatus, GitHubApiClient |
| NFR-U4-08 | R-U4-03 | PublishPipeline |
| NFR-U4-09 | R-U4-04 | FrontmatterUtils, PublishGuard (LC-U4-13) |
| NFR-U4-10 | S-U4-01 | CredentialManager |
| NFR-U4-11 | S-U4-02 | HTMLSanitizer |
| NFR-U4-12 | S-U4-03 | GitHubApiClient |
| NFR-U4-13 | S-U4-03, S-U4-01 | GitHubApiClient, CredentialManager |
| NFR-U4-14 | A-U4-02 | ErrorMessageFormatter |
| NFR-U4-15 | A-U4-01 | PublishDialog, PlatformSettingsDialog, ExportMenu |
| NFR-U4-16 | M-U4-01 | PlatformAdapterRegistry |
| NFR-U4-17 | M-U4-02 | GitHubApiClient (interface + mock) |
| NFR-U4-18 | P-U4-01 | PublishPipeline (requestCountカウンタ — 14画像超で警告、30上限) |
| NFR-U4-19 | P-U4-04 | FrontmatterUtils, HTMLSanitizer (遅延import) |
| NFR-U4-20 | P-U4-05 | PublishPipeline (AbortController) |
| NFR-U4-21 | A-U4-03 | notificationStore |

**全21 NFR要件をパターンまたは直接実装でカバー。漏れなし。**
