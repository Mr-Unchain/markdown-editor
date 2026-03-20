# U1: Foundation - Code Generation Plan

## ユニットコンテキスト

### 対象コンポーネント
- **C9: FileSystemAdapter** — TauriAdapter / WebAdapter
- **C7: SettingsManager** — 設定の読み書き・永続化
- **C8: UIShell（骨格）** — Typora風レイアウト

### MVPストーリー
なし（基盤ユニット — 他ユニットの前提条件）

### 依存関係
- 外部依存なし（U1は他ユニットに依存しない）
- U2, U3, U4 がすべて U1 に依存

### 完了条件
- Tauriアプリが起動し空のUIシェルが表示される
- Web版がブラウザで表示される
- FileSystemAdapterがファイルの読み書きを実行できる
- SettingsManagerが設定を保存・読み込みできる

---

## コード生成ステップ

### Step 1: プロジェクト初期セットアップ
- [x] SvelteKit プロジェクトの作成（`package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`）
- [x] Tauri 2.x の設定（`src-tauri/` ディレクトリ、`Cargo.toml`, `tauri.conf.json`）
- [x] ESLint + Prettier 設定ファイル（`eslint.config.js`, `.prettierrc`）
- [x] `adapter-static` の設定
- [x] `src/app.html`, `src/app.css` の作成

### Step 2: 共通型定義
- [x] `src/lib/types/settings.ts` — AppSettings, EditorSettings, PluginConfig, PlatformConnectionConfig, PlatformConnection, PlatformCredentials（Zenn/Note/MicroCMS/Contentful）
- [x] `src/lib/types/layout.ts` — LayoutState, SidebarPanel
- [x] `src/lib/types/notification.ts` — Notification type, NotificationType
- [x] `src/lib/types/filesystem.ts` — DirEntry, FileContent, FileFilter, FileSystemError, Result<T>

### Step 3: 共通型定義のユニットテスト
- [x] `src/lib/types/__tests__/settings.test.ts` — 型の整合性テスト
- [x] `src/lib/types/__tests__/filesystem.test.ts` — Result型ユーティリティテスト

### Step 4: FileSystemAdapter インターフェースとユーティリティ
- [x] `src/lib/infrastructure/filesystem/types.ts` — FileSystemAdapter インターフェース
- [x] `src/lib/infrastructure/filesystem/safe-call.ts` — safeCall<T>() ユーティリティ、toFileSystemError()
- [x] `src/lib/infrastructure/filesystem/factory.ts` — createFileSystemAdapter() ファクトリ、isTauri(), isFileSystemAccessSupported()

### Step 5: TauriFileSystemAdapter 実装
- [x] `src/lib/infrastructure/filesystem/tauri-fs-adapter.ts` — @tauri-apps/plugin-fs, @tauri-apps/plugin-dialog を使用した全メソッド実装

### Step 6: WebFileSystemAdapter 実装
- [x] `src/lib/infrastructure/filesystem/web-fs-adapter.ts` — File System Access API を使用した全メソッド実装（rename はコピー+削除で代替）

### Step 7: FileSystemAdapter ユニットテスト
- [x] `src/lib/infrastructure/filesystem/__tests__/safe-call.test.ts` — safeCall の正常系・異常系テスト
- [x] `src/lib/infrastructure/filesystem/__tests__/factory.test.ts` — ファクトリ関数の環境分岐テスト
- [x] `src/lib/infrastructure/filesystem/__tests__/tauri-fs-adapter.test.ts` — Tauri APIモックによるテスト
- [x] `src/lib/infrastructure/filesystem/__tests__/web-fs-adapter.test.ts` — File System Access APIモックによるテスト

### Step 8: SecureStorage 実装
- [x] `src/lib/infrastructure/secure-storage/types.ts` — SecureStorage インターフェース
- [x] `src/lib/infrastructure/secure-storage/tauri-secure-storage.ts` — tauri-plugin-stronghold を使用（遅延初期化）
- [x] `src/lib/infrastructure/secure-storage/web-secure-storage.ts` — localStorage + base64 フォールバック

### Step 9: SecureStorage ユニットテスト
- [x] `src/lib/infrastructure/secure-storage/__tests__/tauri-secure-storage.test.ts`
- [x] `src/lib/infrastructure/secure-storage/__tests__/web-secure-storage.test.ts`

### Step 10: SettingsManager 実装
- [x] `src/lib/core/settings/defaults.ts` — DEFAULT_SETTINGS 定義
- [x] `src/lib/core/settings/merge.ts` — mergeWithDefaults() 関数
- [x] `src/lib/core/settings/settings-manager.ts` — SettingsManager クラス（デバウンス書き込み、Svelte Store連携、flush on close）

### Step 11: SettingsManager ユニットテスト
- [x] `src/lib/core/settings/__tests__/defaults.test.ts` — デフォルト値の検証
- [x] `src/lib/core/settings/__tests__/merge.test.ts` — マージロジック（完全一致、部分一致、破損時フォールバック）
- [x] `src/lib/core/settings/__tests__/settings-manager.test.ts` — 初期化、get/set、デバウンス、flush

### Step 12: Svelte Stores
- [x] `src/lib/stores/layout.ts` — layoutState Store（sidebarVisible, sidebarPanel, sidebarWidth）
- [x] `src/lib/stores/settings.ts` — appSettings Store
- [x] `src/lib/stores/notifications.ts` — notifications Store + notify() 関数（タイプ別デフォルト表示時間）
- [x] `src/lib/stores/current-file.ts` — currentFile Store
- [x] `src/lib/stores/save-status.ts` — saveStatus Store

### Step 13: Svelte Stores ユニットテスト
- [x] `src/lib/stores/__tests__/notifications.test.ts` — notify、自動消去、最大3件制限
- [x] `src/lib/stores/__tests__/layout.test.ts` — サイドバートグルロジック

### Step 14: UIShell コンポーネント
- [x] `src/routes/+layout.svelte` — メインレイアウト（サイドバー + メインエリア + ステータスバー構成）
- [x] `src/routes/+page.svelte` — メインページ（エディターエリアのスロット）
- [x] `src/components/shell/Toolbar.svelte` — ツールバー骨格（スロット付き）
- [x] `src/components/shell/Sidebar.svelte` — サイドバー（トグル、200msアニメーション、260px幅）
- [x] `src/components/shell/StatusBar.svelte` — ステータスバー（24px高さ）
- [x] `src/components/shell/NotificationToast.svelte` — Toast通知（右下、最大3件）
- [x] `src/components/shell/ConfirmDialog.svelte` — 確認ダイアログ

### Step 15: UIShell コンポーネントユニットテスト
- [x] `src/components/shell/__tests__/Sidebar.test.ts` — トグル動作、キーボードショートカット
- [x] `src/components/shell/__tests__/NotificationToast.test.ts` — 表示・自動消去・最大件数
- [x] `src/components/shell/__tests__/ConfirmDialog.test.ts` — 表示・確認・キャンセル

### Step 16: アプリ初期化ロジック
- [x] `src/lib/app-init.ts` — アプリ起動シーケンス（FS Adapter生成 → Settings読み込み → UI起動）
- [x] `src/routes/+layout.ts` — SvelteKit load 関数での初期化呼び出し

### Step 17: アプリ初期化ユニットテスト
- [x] `src/lib/__tests__/app-init.test.ts` — 起動シーケンス、エラーハンドリング

### Step 18: コード生成サマリードキュメント
- [x] `aidlc-docs/construction/u1-foundation/code/code-summary.md` — 生成ファイル一覧、アーキテクチャ図、テスト概要

---

## 生成ファイル数
- **型定義**: 5ファイル
- **Infrastructure**: 9ファイル
- **Core**: 3ファイル
- **Stores**: 5ファイル
- **Components**: 7ファイル
- **App Init**: 2ファイル
- **Tests**: 14ファイル
- **Config**: 7ファイル（プロジェクトセットアップ）
- **Documentation**: 1ファイル
- **合計**: 約53ファイル
