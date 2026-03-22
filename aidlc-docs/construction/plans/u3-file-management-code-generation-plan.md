# U3: File Management — Code Generation プラン

## ユニット情報
- **ユニット**: U3 File Management
- **MVPストーリー**: US-09（ワークスペース管理）, US-10（ファイル操作）, US-11（複数タブ編集）
- **コードベース**: Greenfield monolith（`markdown-editor/src/`）
- **既存ファイル数**: 93ファイル（U1 Foundation + U2 Core Editor）
- **context7**: 各ステップで最新APIを確認（Tauri fs, Svelte 5）

## 依存関係
- **U1 既存**: FileSystemAdapter（`src/lib/infrastructure/filesystem/`）, SettingsManager, DirEntry/FileContent型, layout/confirm/notification stores
- **U2 既存**: EditorCore, editor.svelte.ts store, エディターUIコンポーネント

---

## Code Generation Steps

### Step 1: 型定義
- [x] `src/lib/types/workspace.ts` — Workspace, FileTreeNode, Tab, TabCursorState, SessionState, RecentWorkspace, FileFilter, AutoSaveConfig, SkeletalTab
- [x] `src/lib/types/file-manager.ts` — ValidationResult, ContextMenuAction, ConflictAction, RecoveryFile, WatchEvent, FileInfo
- [x] `src/lib/infrastructure/filesystem/types.ts` 更新 — FileSystemAdapter拡張（watch, copyFile, removeDir, getFileInfo, readFilePartial）
- [x] `src/lib/types/settings.ts` 更新 — AppSettings拡張（session, autoSave, maxTabs, recentWorkspaces→RecentWorkspace[]）
- [x] settings/defaults.ts 更新 — 新フィールドのデフォルト値追加

### Step 2: ユーティリティ — バリデーション/セキュリティ
- [x] `src/lib/utils/path-validator.ts` — PathValidator クラス（S-U3-01）
- [x] `src/lib/utils/file-name-validator.ts` — FileNameValidator クラス（S-U3-02）
- [x] `src/lib/utils/file-name-validator.test.ts` — 禁止文字、予約名、最大長、重複テスト（41テスト）
- [x] `src/lib/utils/path-validator.test.ts` — パストラバーサル各種ケーステスト（18テスト）

### Step 3: ユーティリティ — パフォーマンス/信頼性
- [x] `src/lib/utils/file-tree-virtualizer.ts` — FileTreeVirtualizer クラス（P-U3-03）
- [x] `src/lib/utils/focus-trap.ts` — createFocusTrap()（A-U3-03）
- [x] `src/lib/utils/atomic-write.ts` — atomicWriteSession()（R-U3-02）
- [x] `src/lib/utils/file-tree-virtualizer.test.ts`（11テスト）
- [x] `src/lib/utils/focus-trap.test.ts`（5テスト）
- [x] `src/lib/utils/atomic-write.test.ts`（7テスト）

### Step 4: FileSystemAdapter拡張
- [x] `src/lib/infrastructure/filesystem/types.ts` 更新 — watch, copyFile, removeDir, getFileInfo, readFilePartial追加（Step 1で完了）
- [x] `src/lib/infrastructure/filesystem/tauri-fs-adapter.ts` 更新 — 新メソッド実装（stat, copyFile, watch, open/seek/read, removeDir）
- [x] `src/lib/infrastructure/filesystem/web-fs-adapter.ts` 更新 — 新メソッド実装（watch=noop, getFileInfo=File API, readFilePartial=slice）
- [x] context7で @tauri-apps/plugin-fs の watch/watchImmediate API 最新仕様を確認

### Step 5: ストア
- [x] `src/lib/stores/workspace.svelte.ts` — workspaceState ($state), setWorkspace, setLoading, addRecentWorkspace
- [x] `src/lib/stores/tabs.svelte.ts` — tabsState ($state), activeTab, dirtyTabs, タブ操作関数
- [x] `src/lib/stores/file-tree.svelte.ts` — fileTreeState ($state), ノード操作関数
- [x] `src/lib/stores/save-status.svelte.ts` 更新 — autoSaveMode追加

### Step 6: コアロジック — FileTreeLoader
- [x] `src/lib/core/file-manager/file-tree-loader.ts` — loadRootEntries, loadChildren, reloadChildren, applyFilter, sortNodes（P-U3-01）
- [x] `src/lib/core/file-manager/__tests__/file-tree-loader.test.ts`（11テスト）

### Step 7: コアロジック — FileManager
- [x] `src/lib/core/file-manager/file-manager.ts` — ワークスペース管理、ファイルCRUD、タブ管理（全ビジネスロジック）
- [x] `src/lib/core/file-manager/__tests__/file-manager.test.ts`（21テスト: ワークスペース, CRUD, タブ各操作）

### Step 8: コアロジック — FileWatcherManager & RecoveryManager
- [x] `src/lib/utils/file-watcher-manager.ts` — 2層ファイル監視（P-U3-05, R-U3-03）
- [x] `src/lib/core/file-manager/recovery-manager.ts` — クラッシュリカバリ（R-U3-01）
- [x] `src/lib/utils/__tests__/file-watcher-manager.test.ts`（7テスト）
- [x] `src/lib/core/file-manager/__tests__/recovery-manager.test.ts`（6テスト）

### Step 9: サービス — WorkspaceService
- [x] `src/lib/services/workspace-service.ts` — initialize, openWorkspace, closeWorkspace, saveSession, restoreSession, requestClose（P-U3-04）
- [x] `src/lib/services/__tests__/workspace-service.test.ts`（9テスト）

### Step 10: UIコンポーネント — サイドバー
- [x] `src/components/shell/Sidebar.svelte` 更新 — ファイルツリー統合（ワークスペース未選択時/選択時の切り替え）
- [x] `src/components/sidebar/SidebarHeader.svelte` — ワークスペース名、+ボタン、フィルタ
- [x] `src/components/sidebar/FileTree.svelte` — ファイルツリー表示（role="tree"、A-U3-01）
- [x] `src/components/sidebar/FileTreeItem.svelte` — 個別ノード（role="treeitem"、再帰、キーボード操作）
- [x] `src/components/sidebar/InlineRenameInput.svelte` — インライン名前入力
- [x] `src/components/sidebar/__tests__/FileTree.test.ts`（4テスト: 表示、ARIA）
- [x] `src/components/sidebar/__tests__/FileTreeItem.test.ts`（4テスト）
- [x] data-testid属性を全インタラクティブ要素に付与

### Step 11: UIコンポーネント — タブバー
- [x] `src/components/tabs/TabBar.svelte` — タブバー（role="tablist"、D&D、キーボード、A-U3-02）
- [x] `src/components/tabs/TabItem.svelte` — 個別タブ（role="tab"、未保存インジケーター）
- [x] `src/components/tabs/__tests__/TabBar.test.ts`（6テスト: 表示、切替、ARIA）
- [x] data-testid属性を全インタラクティブ要素に付与

### Step 12: UIコンポーネント — ダイアログ/メニュー/ステータスバー
- [x] `src/components/dialogs/NewFileDialog.svelte` — 新規作成ダイアログ（dialog要素、バリデーション、A-U3-03）
- [x] `src/components/dialogs/RecoveryDialog.svelte` — リカバリダイアログ
- [x] `src/components/shared/ContextMenu.svelte` — コンテキストメニュー（role="menu"、キーボード）
- [x] `src/components/shell/StatusBar.svelte` 更新 — 自動保存トグル追加
- [x] `src/components/editor/PlainTextEditor.svelte` — プレーンテキストエディター
- [x] `src/components/editor/WelcomeView.svelte` — ウェルカム画面
- [x] `src/components/dialogs/__tests__/NewFileDialog.test.ts`（5テスト）
- [x] `src/components/dialogs/__tests__/RecoveryDialog.test.ts`（3テスト）
- [x] `src/components/shared/__tests__/ContextMenu.test.ts`（4テスト）

### Step 13: CSS
- [x] `src/components/sidebar/sidebar.css` — コンポーネントスコープCSS
- [x] `src/components/tabs/tabs.css` — コンポーネントスコープCSS
- [x] `src/components/dialogs/dialogs.css` — コンポーネントスコープCSS
- [x] `src/components/shared/context-menu.css` — コンポーネントスコープCSS
- [x] Svelte scoped stylesでPlainTextEditor, WelcomeView, StatusBar自動保存トグル

### Step 14: レイアウト統合
- [x] `src/routes/+layout.svelte` 更新 — サイドバー、タブバー、エディタエリア（条件分岐: markdown/plaintext/welcome）統合
- [x] `src/lib/app-init.ts` 更新 — WorkspaceService.initialize() を起動フローに組み込み
- [x] ファイル保存（Ctrl+S）のグローバルキーバインド追加

### Step 15: テスト実行 + 修正
- [x] 全テスト実行（`pnpm test`）
- [x] エラー修正
- [x] テスト結果記録

### Step 16: コード生成サマリー
- [x] `aidlc-docs/construction/u3-file-management/code/code-generation-summary.md` — ファイル一覧、テスト結果、ストーリートレーサビリティ、NFRパターン適用記録

---

## ストーリートレーサビリティ

| ストーリー | 対応ステップ | 対応ファイル（主要） |
|---|---|---|
| US-09 ワークスペース管理 | Step 1,5,6,7,9,10,14 | FileManager, WorkspaceService, Sidebar, FileTree, +layout |
| US-10 ファイル操作 | Step 1,2,4,7,8,12 | FileManager, FileNameValidator, NewFileDialog, ContextMenu, RecoveryManager |
| US-11 複数タブ編集 | Step 1,3,5,7,11,14 | FileManager (tab mgmt), TabBar, TabItem, +layout |

## NFRパターン適用

| パターン | 対応ステップ |
|---|---|
| P-U3-01 遅延ツリー読み込み | Step 6 |
| P-U3-02 タブコンテンツキャッシュ | Step 7 |
| P-U3-03 仮想スクロール | Step 3,10 |
| P-U3-04 セッション遅延復元 | Step 9 |
| P-U3-05 ファイル監視デバウンス | Step 8 |
| P-U3-06 ファイル操作ガイドライン | Step 7 |
| R-U3-01 クラッシュリカバリ | Step 8 |
| R-U3-02 アトミック保存 | Step 3 |
| R-U3-03 外部変更競合解決 | Step 8 |
| R-U3-04 I/Oエラーハンドリング | Step 7 |
| S-U3-01 パストラバーサル防御 | Step 2 |
| S-U3-02 ファイル名サニタイズ | Step 2 |
| S-U3-03 インポート安全性 | Step 7 |
| A-U3-01 ツリーウィジェット | Step 10 |
| A-U3-02 タブウィジェット | Step 11 |
| A-U3-03 ダイアログ/メニュー | Step 3,12 |
| M-U3-01 テスト戦略 | Step 2,3,6,7,8,9,10,11,12,15 |
| M-U3-02 FSAdapter抽象化 | Step 4 |

## 見積もり
- **生成ファイル数**: 約55ファイル（ソース30 + テスト15 + CSS5 + 型3 + サマリー1 + 更新6）
- **テスト数**: 約120テスト
