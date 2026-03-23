# U4 Platform Integration — コード生成サマリー

## 生成ファイル一覧

### 型定義（Step 1）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/types/platform.ts` | 新規 | U4中核型定義（PlatformAdapter, PublishPipeline, Error classes等） |
| `src/lib/types/export.ts` | 新規 | ExportFormat, ExportResult |
| `src/lib/types/notification.ts` | 修正 | error duration → 0（手動消去, NFR-U4-21） |
| `src/lib/types/settings.ts` | 修正 | ZennCredentials拡張（repositoryOwner, repositoryName, branch） |

### Infrastructure Layer（Step 2-3）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/integration/platform/github-api-client.ts` | 新規 | GitHubApiClient interface + Impl + Mock（HTTPS検証, ログマスク, AbortSignal） |
| `src/lib/integration/platform/github-api-schemas.ts` | 新規 | zod契約テストスキーマ |
| `src/lib/services/credential-manager.ts` | 新規 | withCredentials on-demandパターン |
| `src/lib/integration/platform/__tests__/github-api-client.test.ts` | 新規 | MockGitHubApiClient + zodスキーマ契約テスト |
| `src/lib/services/__tests__/credential-manager.test.ts` | 新規 | CredentialManager テスト |

### Utility Layer（Step 4-5）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/integration/export/frontmatter-utils.ts` | 新規 | gray-matter遅延import, js-yaml 4.x engine override |
| `src/lib/integration/export/html-sanitizer.ts` | 新規 | DOMPurify遅延import, 環境ガード |
| `src/lib/utils/network-status.svelte.ts` | 新規 | $state online/offline監視 |
| `src/lib/utils/error-messages.ts` | 新規 | what/why/action 3要素エラーメッセージ |
| `src/lib/integration/export/__tests__/frontmatter-utils.test.ts` | 新規 | テスト |
| `src/lib/integration/export/__tests__/html-sanitizer.test.ts` | 新規 | テスト |
| `src/lib/utils/__tests__/network-status.test.ts` | 新規 | テスト |
| `src/lib/utils/__tests__/error-messages.test.ts` | 新規 | テスト |

### Integration Layer（Step 6-7）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/integration/platform/types.ts` | 新規 | PlatformAdapter re-export |
| `src/lib/integration/platform/platform-adapter-registry.ts` | 新規 | Map-based adapter registry |
| `src/lib/integration/platform/zenn/zenn-adapter.ts` | 新規 | ZennAdapter（GitHubApiClient DI, 409 retry） |
| `src/lib/integration/platform/zenn/zenn-frontmatter.ts` | 新規 | Zenn frontmatter変換, slug生成 |
| `src/lib/integration/export/export-service.ts` | 新規 | toHTML, toMarkdown, clipboard, download |
| `src/lib/integration/platform/zenn/__tests__/zenn-adapter.test.ts` | 新規 | テスト |
| `src/lib/integration/platform/__tests__/platform-adapter-registry.test.ts` | 新規 | テスト |
| `src/lib/integration/export/__tests__/export-service.test.ts` | 新規 | テスト |

### Core Layer（Step 8-9）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/core/image-manager/image-manager.ts` | 新規 | handleDrop, handlePaste, uploadForPlatform |
| `src/lib/core/image-manager/image-validator.ts` | 新規 | MIME/サイズバリデーション |
| `src/lib/core/image-manager/image-naming.ts` | 新規 | Typora式ファイル名生成 |
| `src/lib/core/image-manager/__tests__/image-manager.test.ts` | 新規 | テスト |
| `src/lib/core/image-manager/__tests__/image-validator.test.ts` | 新規 | テスト |
| `src/lib/core/image-manager/__tests__/image-naming.test.ts` | 新規 | テスト |

### Service Layer（Step 10-11）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/services/publish-pipeline.ts` | 新規 | 7ステップ非同期パイプライン（AbortController, ProgressCallback） |
| `src/lib/services/publish.ts` | 新規 | PublishService + PublishGuard |
| `src/lib/services/__tests__/publish-pipeline.test.ts` | 新規 | テスト |
| `src/lib/services/__tests__/publish-service.test.ts` | 新規 | テスト |

### Store Layer（Step 12-13）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/stores/publish-store.svelte.ts` | 新規 | $state progress/lastResult/lastError |
| `src/lib/stores/platform-store.svelte.ts` | 新規 | $state connections, loadConnections |
| `src/lib/stores/image-store.svelte.ts` | 新規 | handleImageDrop/Paste |
| `src/lib/stores/__tests__/publish-store.test.ts` | 新規 | テスト |
| `src/lib/stores/__tests__/platform-store.test.ts` | 新規 | テスト |
| `src/lib/stores/__tests__/image-store.test.ts` | 新規 | テスト |

### UI Components（Step 14-16）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/components/dialogs/PublishDialog.svelte` | 新規 | 投稿ダイアログ（WCAG AAA） |
| `src/components/dialogs/PublishProgressIndicator.svelte` | 新規 | 7ステップ進捗表示 |
| `src/components/dialogs/PlatformSettingsDialog.svelte` | 新規 | プラットフォーム接続設定 |
| `src/components/dialogs/PlatformConnectionCard.svelte` | 新規 | 接続カード |
| `src/components/dialogs/RetryDialog.svelte` | 新規 | リトライカウントダウン |
| `src/components/toolbar/ExportMenu.svelte` | 新規 | エクスポートドロップダウン |
| `src/components/toolbar/PublishButton.svelte` | 新規 | 投稿ボタン（ネットワーク状態連動） |
| `src/components/editor/ImageDropOverlay.svelte` | 新規 | 画像ドラッグ&ドロップ |
| `src/components/__tests__/PublishDialog.test.ts` | 新規 | テスト |
| `src/components/__tests__/ExportMenu.test.ts` | 新規 | テスト |
| `src/components/__tests__/ImageDropOverlay.test.ts` | 新規 | テスト |
| `src/components/__tests__/PlatformSettingsDialog.test.ts` | 新規 | テスト |

### App Integration（Step 17-18）
| ファイル | 操作 | 概要 |
|---|---|---|
| `src/lib/app-init.ts` | 修正 | U4初期化コード追加（initializePlatformIntegration） |
| `src/lib/core/editor/slash-commands.ts` | 修正 | /export, /image, /publish コマンド追加 |
| `package.json` | 修正 | gray-matter, js-yaml, dompurify, zod 追加 |

---

## ストーリーカバレッジ

| ストーリー | カバレッジ |
|---|---|
| US-12 Zenn記事投稿 | ✅ ZennAdapter, PublishPipeline, PublishService, PublishDialog, CredentialManager, publishStore |
| US-16 プラットフォーム向けエクスポート | ✅ ExportService, FrontmatterUtils, HTMLSanitizer, ExportMenu |
| US-17 画像挿入 | ✅ ImageManager, ImageValidator, ImageNaming, ImageDropOverlay, imageStore |
| US-18 プラットフォーム画像アップロード | ✅ ImageManager.uploadForPlatform, ZennAdapter.uploadImage, PublishPipeline画像ステップ |
| US-22 プラットフォーム接続設定 | ✅ PlatformSettingsDialog, PlatformConnectionCard, platformStore, CredentialManager |

## テストカバレッジ

| レイヤー | テストファイル数 | テスト対象 |
|---|---|---|
| Infrastructure | 2 | GitHubApiClient契約テスト, CredentialManager |
| Utility | 4 | FrontmatterUtils, HTMLSanitizer, NetworkStatus, ErrorMessages |
| Integration | 3 | ZennAdapter, PlatformAdapterRegistry, ExportService |
| Core | 3 | ImageManager, ImageValidator, ImageNaming |
| Service | 2 | PublishPipeline, PublishService |
| Store | 3 | publishStore, platformStore, imageStore |
| UI Component | 4 | PublishDialog, ExportMenu, ImageDropOverlay, PlatformSettingsDialog |
| **合計** | **21** | |

## NFR対応状況

| NFR | 対応内容 |
|---|---|
| NFR-U4-01 | ExportService: エクスポート完了 ≤2秒 |
| NFR-U4-02 | ImageManager: 5MB制限, MIME検証 |
| NFR-U4-03 | PublishDialog/PlatformSettingsDialog: WCAG AAA準拠 |
| NFR-U4-04 | app-init.ts: initializePlatformIntegration ≤140ms |
| NFR-U4-05 | PublishPipeline: ProgressCallback 200ms以内更新 |
| NFR-U4-06 | ExportService: オフライン時ローカルエクスポート可能 |
| NFR-U4-07 | NetworkStatus: online/offline監視 |
| NFR-U4-08 | PublishPipeline: AbortController/timeout 300秒 |
| NFR-U4-09 | FrontmatterUtils: 冪等投稿記録 |
| NFR-U4-10 | GitHubApiClient: HTTPS強制 |
| NFR-U4-11 | GitHubApiClient: ログマスク |
| NFR-U4-12 | ErrorMessages: what/why/action 3要素 |
| NFR-U4-13 | PublishGuard: 多重投稿防止 |
| NFR-U4-14 | HTMLSanitizer: DOMPurify sanitization |
| NFR-U4-15 | CredentialManager: on-demand, GC-eligible |
| NFR-U4-16 | js-yaml 4.x: CVE対策engine override |
| NFR-U4-17 | DOMPurify: 環境ガード（typeof window） |
| NFR-U4-18 | PublishPipeline: 30リクエスト/投稿, 14画像警告閾値 |
| NFR-U4-21 | notifications.svelte.ts: error duration 0（手動消去） |

## 設計パターン

| パターン | 適用箇所 |
|---|---|
| P-U4-01 AbortController | PublishPipeline, GitHubApiClient |
| P-U4-02 遅延初期化 | app-init.ts: バックグラウンド接続テスト |
| P-U4-03 進捗ストリーミング | PublishPipeline → ProgressCallback → publishStore |
| S-U4-01 On-demand Credentials | CredentialManager.withCredentials |
| R-U4-01 NetworkStatus | NetworkStatus + ExportService fallback |
| R-U4-02 GitHubApiClient retry | ZennAdapter 409 SHA retry |
| R-U4-03 Pipeline timeout | PublishPipeline PIPELINE_TIMEOUT_MS |
| R-U4-04 Idempotent publish | PublishGuard + FrontmatterUtils |
| M-U4-01 Adapter Registry | PlatformAdapterRegistry |
| M-U4-02 Contract Testing | MockGitHubApiClient + zod schemas |
