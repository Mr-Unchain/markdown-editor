# U4 Platform Integration — Code Generation Plan

## 概要
U4 Platform Integrationの5 MVPストーリー（US-12, US-16, US-17, US-18, US-22）を実装する。

## ユニットコンテキスト
- **ストーリー**: US-12（Zenn記事投稿）, US-16（プラットフォーム向けエクスポート）, US-17（画像挿入）, US-18（プラットフォーム画像アップロード）, US-22（プラットフォーム接続設定）
- **依存**: U1 Foundation（SettingsManager, FileSystemAdapter, SecureStorage）, U2 Core Editor（EditorCore, slash-commands）, U3 File Management（FocusTrap, WorkspaceService）
- **アプリケーションルート**: `markdown-editor/markdown-editor/src/`

## 既存リソースとの統合
- `notifications.svelte.ts` → 既存を活用（NFR-U4-21のerror手動消去はnotification.tsの修正で対応）
- `NotificationToast.svelte` → 既存を活用
- `plugins/zenn/index.ts` → Zenn構文プラグイン（既存）。U4のZennAdapterとは別レイヤー
- `app-init.ts` → U4初期化コードを追加
- `infrastructure/secure-storage/` → CredentialManagerが利用

---

## Step 1: 型定義（Types） ✅
- [x] `src/lib/types/platform.ts` — PlatformAdapter, PlatformConnection, PlatformCredentials, ZennCredentials, ConnectionTestResult, ArticlePayload, PublishResult, PublishRecord, PublishProgress, PublishStep, ImageProgress, LocalImageRef, ImageUploadResult, ImageAsset 型定義
- [x] `src/lib/types/export.ts` — ExportFormat, ExportResult 型定義
- [x] `src/lib/types/notification.ts` — 既存ファイル修正: error duration を 0（手動消去）に変更（NFR-U4-21）
- [x] `src/lib/types/settings.ts` — 既存ファイル修正: ZennCredentialsにrepositoryOwner, repositoryName, branch追加
- **ストーリー**: US-12, US-16, US-17, US-18, US-22 共通基盤

## Step 2: Infrastructure Layer ✅
- [x] `src/lib/integration/platform/github-api-client.ts` — GitHubApiClient interface + GitHubApiClientImpl + MockGitHubApiClient（fetch wrapper, HTTPS検証, ログマスク, AbortSignal対応）(LC-U4-01)
- [x] `src/lib/integration/platform/github-api-schemas.ts` — zod スキーマ（GitHubFileResponseSchema, GitHubCommitResponseSchema, GitHubRateLimitResponseSchema）(M-U4-02)
- [x] `src/lib/services/credential-manager.ts` — CredentialManager（withCredentials パターン）(LC-U4-08)
- **ストーリー**: US-12, US-22

## Step 3: Infrastructure Layer テスト ✅
- [x] `src/lib/integration/platform/__tests__/github-api-client.test.ts` — MockGitHubApiClient テスト（契約テスト with zodスキーマ）
- [x] `src/lib/services/__tests__/credential-manager.test.ts` — CredentialManager テスト

## Step 4: Utility Layer ✅
- [x] `src/lib/integration/export/frontmatter-utils.ts` — FrontmatterUtils（gray-matter 遅延import, js-yaml 4.x engine override）(LC-U4-09)
- [x] `src/lib/integration/export/html-sanitizer.ts` — HTMLSanitizer（DOMPurify 遅延import, ALLOWED_TAGS/ATTR, 環境ガード）(LC-U4-10)
- [x] `src/lib/utils/network-status.svelte.ts` — NetworkStatus（$state, online/offline監視）(LC-U4-11)
- [x] `src/lib/utils/error-messages.ts` — ErrorMessageFormatter（what/why/action 3要素パターン）(LC-U4-12)
- **ストーリー**: US-12, US-16

## Step 5: Utility Layer テスト ✅
- [x] `src/lib/integration/export/__tests__/frontmatter-utils.test.ts`
- [x] `src/lib/integration/export/__tests__/html-sanitizer.test.ts`
- [x] `src/lib/utils/__tests__/network-status.test.ts`
- [x] `src/lib/utils/__tests__/error-messages.test.ts`

## Step 6: Integration Layer ✅
- [x] `src/lib/integration/platform/types.ts` — PlatformAdapter re-export
- [x] `src/lib/integration/platform/platform-adapter-registry.ts` — PlatformAdapterRegistry（register/get/getAll）(LC-U4-03)
- [x] `src/lib/integration/platform/zenn/zenn-adapter.ts` — ZennAdapter implements PlatformAdapter（GitHubApiClient DI, 409 SHA retry）(LC-U4-02)
- [x] `src/lib/integration/platform/zenn/zenn-frontmatter.ts` — Zenn frontmatter変換ヘルパー + slug生成
- [x] `src/lib/integration/export/export-service.ts` — ExportService（toMarkdown, toHTML, clipboard, download）(LC-U4-05)
- **ストーリー**: US-12, US-16, US-18

## Step 7: Integration Layer テスト ✅
- [x] `src/lib/integration/platform/zenn/__tests__/zenn-adapter.test.ts`
- [x] `src/lib/integration/platform/__tests__/platform-adapter-registry.test.ts`
- [x] `src/lib/integration/export/__tests__/export-service.test.ts`

## Step 8: Core Layer ✅
- [x] `src/lib/core/image-manager/image-manager.ts` — ImageManager (LC-U4-04)
- [x] `src/lib/core/image-manager/image-validator.ts` — 画像バリデーション
- [x] `src/lib/core/image-manager/image-naming.ts` — ファイル名生成
- **ストーリー**: US-17, US-18

## Step 9: Core Layer テスト ✅
- [x] `src/lib/core/image-manager/__tests__/image-manager.test.ts`
- [x] `src/lib/core/image-manager/__tests__/image-validator.test.ts`
- [x] `src/lib/core/image-manager/__tests__/image-naming.test.ts`

## Step 10: Service Layer ✅
- [x] `src/lib/services/publish-pipeline.ts` — PublishPipeline (LC-U4-06)
- [x] `src/lib/services/publish.ts` — PublishService + PublishGuard (LC-U4-07, LC-U4-13)
- **ストーリー**: US-12

## Step 11: Service Layer テスト ✅
- [x] `src/lib/services/__tests__/publish-pipeline.test.ts`
- [x] `src/lib/services/__tests__/publish-service.test.ts`

## Step 12: Store Layer ✅
- [x] `src/lib/stores/publish-store.svelte.ts`
- [x] `src/lib/stores/platform-store.svelte.ts`
- [x] `src/lib/stores/image-store.svelte.ts`
- **ストーリー**: US-12, US-17, US-18, US-22

## Step 13: Store Layer テスト ✅
- [x] `src/lib/stores/__tests__/publish-store.test.ts`
- [x] `src/lib/stores/__tests__/platform-store.test.ts`
- [x] `src/lib/stores/__tests__/image-store.test.ts`

## Step 14: UI Components — Dialogs ✅
- [x] `src/components/dialogs/PublishDialog.svelte`
- [x] `src/components/dialogs/PublishProgressIndicator.svelte`
- [x] `src/components/dialogs/PlatformSettingsDialog.svelte`
- [x] `src/components/dialogs/PlatformConnectionCard.svelte`
- [x] `src/components/dialogs/RetryDialog.svelte`

## Step 15: UI Components — Toolbar & Editor ✅
- [x] `src/components/toolbar/ExportMenu.svelte`
- [x] `src/components/toolbar/PublishButton.svelte`
- [x] `src/components/editor/ImageDropOverlay.svelte`

## Step 16: UI Components テスト ✅
- [x] `src/components/__tests__/PublishDialog.test.ts`
- [x] `src/components/__tests__/ExportMenu.test.ts`
- [x] `src/components/__tests__/ImageDropOverlay.test.ts`
- [x] `src/components/__tests__/PlatformSettingsDialog.test.ts`

## Step 17: App Integration ✅
- [x] `src/lib/app-init.ts` — 既存ファイル修正: U4初期化コード追加（PlatformAdapterRegistry, platformStore.loadConnections, ExportService, ImageManager, PublishService, スラッシュコマンド登録）
- [x] `src/lib/core/editor/slash-commands.ts` — 既存ファイル修正: /export, /image, /publish コマンド追加
- **ストーリー**: 全US

## Step 18: パッケージ追加・設定更新 ✅
- [x] `package.json` — gray-matter ^4.x, js-yaml ^4.x, dompurify ^3.x, zod ^3.x 追加
- [x] `vite.config.ts` — 確認済み: SvelteKit標準設定でdynamic import対応済み、変更不要

## Step 19: コード生成サマリー ✅
- [x] `aidlc-docs/construction/u4-platform-integration/code/code-generation-summary.md` — 生成ファイル一覧、ストーリーカバレッジ、テストカバレッジ

---

## ストーリーカバレッジマトリックス

| Story | Steps |
|---|---|
| US-12 Zenn記事投稿 | 1,2,6,10,12,14,17 |
| US-16 プラットフォーム向けエクスポート | 1,4,6,15,17 |
| US-17 画像挿入 | 1,8,12,15,17 |
| US-18 プラットフォーム画像アップロード | 1,6,8,12,17 |
| US-22 プラットフォーム接続設定 | 1,2,12,14,17 |

---

## 質問ファイル
なし（NFR Design完了時点で全設計判断が確定済み）
