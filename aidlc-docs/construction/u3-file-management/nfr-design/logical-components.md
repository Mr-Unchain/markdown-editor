# U3: File Management — 論理コンポーネント設計

## コンポーネント階層図

```
WorkspaceService（S2: オーケストレーション）
├── FileManager（C2: コアロジック）
│   ├── FileTreeLoader（遅延読み込み）
│   ├── PathValidator（セキュリティ）
│   ├── FileNameValidator（バリデーション）
│   └── FileSystemAdapter（C9: I/O、U1既存）
├── FileWatcherManager（ファイル監視）
│   ├── WorkspaceWatcher（Layer 1: ツリー更新）
│   └── TabFileWatchers（Layer 2: 内容更新）
├── RecoveryManager（クラッシュリカバリ）
├── SettingsManager（C7: 設定永続化、U1既存）
└── EditorCore（C1: エディター、U2既存）

UIコンポーネント（C8: UIShell）
├── Sidebar.svelte
│   ├── SidebarHeader.svelte
│   ├── FileTree.svelte
│   │   ├── FileTreeItem.svelte（再帰）
│   │   ├── InlineRenameInput.svelte
│   │   └── FileTreeVirtualizer（仮想スクロール）
│   └── SidebarFooter.svelte
├── TabBar.svelte
│   └── TabItem.svelte（D&D対応）
├── EditorArea
│   ├── EditorContainer.svelte（U2既存）
│   ├── PlainTextEditor.svelte
│   └── WelcomeView.svelte
├── StatusBar.svelte（自動保存トグル含む）
├── NewFileDialog.svelte
├── ContextMenu.svelte
└── RecoveryDialog.svelte
```

---

## 論理コンポーネント詳細

### FileManager（C2拡張）

**責務**: ワークスペース/ファイル/タブのライフサイクル管理

**内部構成**:
```typescript
class FileManager {
  private fileTreeLoader: FileTreeLoader
  private pathValidator: PathValidator
  private fileNameValidator: typeof FileNameValidator

  constructor(
    private fs: FileSystemAdapter,
    private workspaceRoot: string
  )

  // --- ワークスペース ---
  async openWorkspace(path: string): Promise<Result<Workspace>>
  async closeWorkspace(): Promise<boolean>

  // --- ファイルツリー ---
  async expandFolder(path: string): Promise<FileTreeNode[]>
  collapseFolder(path: string): void
  applyFilter(filter: FileFilter): void

  // --- ファイルCRUD ---
  async createFile(parentPath: string, name: string): Promise<Result<FileTreeNode>>
  async createFolder(parentPath: string, name: string): Promise<Result<FileTreeNode>>
  async saveFile(path: string, content: string): Promise<Result<void>>
  async renameFile(oldPath: string, newName: string): Promise<Result<string>>
  async deleteFile(path: string): Promise<Result<void>>
  async copyFile(src: string, destDir: string): Promise<Result<string>>
  async moveFile(src: string, destDir: string): Promise<Result<string>>
  copyPath(path: string): void
  copyRelativePath(path: string): void

  // --- タブ管理 ---
  async openTab(path: string): Promise<Result<Tab>>
  async closeTab(path: string): Promise<boolean>
  switchTab(path: string): void
  markDirty(path: string): void
  reorderTabs(from: number, to: number): void
}
```

**NFRパターン適用**:
- P-U3-01: FileTreeLoader経由で遅延読み込み
- P-U3-02: タブコンテンツキャッシュ
- S-U3-01: PathValidator経由でパストラバーサル防止
- S-U3-02: FileNameValidator経由でサニタイズ
- R-U3-04: 全I/OでResult型 + エラー通知

---

### WorkspaceService（S2）

**責務**: ワークスペース初期化・復元・終了のオーケストレーション

```typescript
class WorkspaceService {
  constructor(
    private fileManager: FileManager,
    private fileWatcher: FileWatcherManager,
    private recoveryManager: RecoveryManager,
    private settings: SettingsManager
  )

  /**
   * アプリ初期化
   * Phase 1: セッション読込 + ワークスペースオープン（200ms）
   * Phase 2: アクティブタブ復元（200ms）
   * Phase 3: ファイル監視開始（非同期、起動ブロックしない）
   * Phase 4: リカバリチェック（非同期）
   */
  async initialize(): Promise<void>

  async openWorkspace(): Promise<void>
  async closeWorkspace(): Promise<void>
  async saveSession(): Promise<void>
  async restoreSession(): Promise<void>
  async requestClose(): Promise<boolean>
}
```

**初期化シーケンス**:
```
App起動
  │
  ├─[Phase 1: 即時]─────────────────────── 200ms
  │  SettingsManager.get('session')
  │  FileManager.openWorkspace(path)
  │
  ├─[Phase 2: アクティブタブ]────────────── 200ms
  │  FileManager.openTab(activeTabPath)
  │  EditorCore.setContent() + カーソル復元
  │
  ├─[Phase 3: 非同期（バックグラウンド）]─── ブロックなし
  │  FileWatcherManager.startWorkspaceWatch()
  │  非アクティブタブは skeletal 状態で表示
  │
  └─[Phase 4: 非同期（バックグラウンド）]─── ブロックなし
     RecoveryManager.checkAndRecover()
     → リカバリファイルあれば RecoveryDialog 表示
```

---

### FileWatcherManager

**責務**: 2層ファイル監視の管理

```typescript
class FileWatcherManager {
  private workspaceWatcher: UnwatchFn | null = null
  private tabWatchers: Map<string, UnwatchFn> = new Map()

  constructor(
    private fs: FileSystemAdapter,
    private onTreeChange: (event: WatchEvent) => void,
    private onFileChange: (filePath: string) => void
  )

  // Layer 1: ワークスペース全体監視
  async startWorkspaceWatch(rootPath: string): Promise<void>
  async stopWorkspaceWatch(): Promise<void>

  // Layer 2: タブファイル個別監視
  async watchTabFile(filePath: string): Promise<void>
  async unwatchTabFile(filePath: string): Promise<void>

  // 全停止
  async stopAll(): Promise<void>
}
```

**Layer 1 イベントハンドリング**:
```
WatchEvent (debounce 500ms)
  │
  ├── create → 親フォルダの子ノード再読み込み
  ├── delete → ファイルツリーからノード削除 + 開いているタブがあれば警告
  ├── rename → ファイルツリー更新 + タブパス更新
  └── modify → （Layer 1 では無視、Layer 2 が担当）
```

**Layer 2 イベントハンドリング**:
```
FileChange (debounce 500ms)
  │
  ├── isDirty = false → 自動リロード + 通知
  └── isDirty = true  → 競合解決ダイアログ（R-U3-03）
```

---

### RecoveryManager

**責務**: クラッシュリカバリファイルの管理

```typescript
class RecoveryManager {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly INTERVAL_MS = 30_000
  private readonly RECOVERY_DIR = '.markdown-editor-recovery'

  constructor(private fs: FileSystemAdapter)

  start(): void          // 30秒間隔タイマー開始
  stop(): void           // タイマー停止
  async writeRecoveryFiles(tabs: Tab[]): Promise<void>
  async checkAndRecover(workspacePath: string): Promise<RecoveryFile[]>
  async applyRecovery(file: RecoveryFile): Promise<void>
  async cleanup(filePath?: string): Promise<void>
}
```

**autoモード連携**:
- `autoSaveConfig.mode === 'auto'` → `start()` を呼ばない
- `autoSaveConfig.mode === 'manual'` → `start()` を呼ぶ
- モード切替時に `start()` / `stop()` を切替

---

### FileTreeVirtualizer

**責務**: 大規模フォルダの仮想スクロール

```typescript
class FileTreeVirtualizer {
  private readonly ITEM_HEIGHT = 28
  private readonly BUFFER_SIZE = 20
  private flatNodes: FileTreeNode[] = []

  flatten(roots: FileTreeNode[]): FileTreeNode[]
  getVisibleRange(scrollTop: number, containerHeight: number): VisibleRange
  getVisibleNodes(range: VisibleRange): FileTreeNode[]
  getTotalHeight(): number
  getNodeDepth(node: FileTreeNode): number
}
```

**発動閾値**: フォルダ内エントリ数 > 200

---

### PathValidator

**責務**: パストラバーサル防止（Layer 1 & 2）

```typescript
class PathValidator {
  constructor(private workspaceRoot: string)

  validatePath(targetPath: string): Result<string>
  validateNoADS(targetPath: string): Result<void>
  isWithinWorkspace(targetPath: string): boolean
  getRelativePath(absolutePath: string): string
}
```

---

## ストア構成

### workspace.svelte.ts
```typescript
export const workspaceState = $state<WorkspaceState>({
  workspace: null,
  isLoading: false,
  recentWorkspaces: [],
})

// 操作関数
export function setWorkspace(ws: Workspace | null): void
export function setLoading(loading: boolean): void
export function addRecentWorkspace(ws: RecentWorkspace): void
```

### tabs.svelte.ts
```typescript
export const tabsState = $state<TabsState>({
  tabs: [],
  activeTabPath: null,
  maxTabs: 20,
  autoSaveMode: 'manual',
})

// Derived
export const activeTab = $derived(...)
export const dirtyTabs = $derived(...)
export const hasDirtyTabs = $derived(...)

// 操作関数
export function addTab(tab: Tab): void
export function removeTab(path: string): void
export function setActiveTab(path: string): void
export function updateTabContent(path: string, content: string): void
export function setTabDirty(path: string, dirty: boolean): void
export function reorderTab(from: number, to: number): void
export function setAutoSaveMode(mode: 'auto' | 'manual'): void
```

### file-tree.svelte.ts
```typescript
export const fileTreeState = $state<FileTreeState>({
  nodes: [],
  selectedPath: null,
  filter: { showHiddenFiles: false, extensionFilter: [], isFilterActive: false },
})

// 操作関数
export function setNodes(nodes: FileTreeNode[]): void
export function updateNode(path: string, updates: Partial<FileTreeNode>): void
export function removeNode(path: string): void
export function addNode(parentPath: string, node: FileTreeNode): void
export function setSelectedPath(path: string | null): void
export function setFilter(filter: FileFilter): void
```

---

## データフロー図

### ファイル開く → タブ表示
```
FileTree click(file)
  → FileManager.openTab(path)
    → PathValidator.validatePath(path) [S-U3-01]
    → FileSystemAdapter.readFile(path)
    → Tab 生成 + tabsState 更新
    → EditorCore.setContent(content) [P-U3-02]
    → FileWatcherManager.watchTabFile(path) [P-U3-05]
    → 通知 aria-live [A-U3-03]
```

### 外部変更検出 → 競合解決
```
FileWatcherManager (Layer 2) detect change
  → debounce 500ms [P-U3-05]
  → tab.isDirty ?
    → false: auto-reload + 通知 [R-U3-03]
    → true: 確認ダイアログ表示 [R-U3-03, A-U3-03]
      → 「外部を読込」: reload + isDirty=false
      → 「ローカル保持」: 無視
```

### Ctrl+S → ファイル保存
```
keydown Ctrl+S
  → FileManager.saveFile(path, content)
    → PathValidator.validatePath(path) [S-U3-01]
    → FileSystemAdapter.writeFile(path, content)
    → tab.isDirty = false
    → saveState.status = 'saved'
    → RecoveryManager.cleanup(path) [R-U3-01]
    → WorkspaceService.saveSession() [R-U3-02]
    → 通知 aria-live [A-U3-03]
```

### アプリ起動 → セッション復元
```
App mount
  → WorkspaceService.initialize()
    → [Phase 1] Session読込 + openWorkspace [P-U3-04]
    → [Phase 2] アクティブタブ復元 [P-U3-02, P-U3-04]
    → [Phase 3] FileWatcherManager.start() [P-U3-05] (async)
    → [Phase 4] RecoveryManager.check() [R-U3-01] (async)
```

---

## ファイル配置計画

```
src/lib/
├── types/
│   ├── workspace.ts          # Workspace, FileTreeNode, Tab, SessionState等
│   └── file-manager.ts       # FileFilter, ValidationResult, AutoSaveConfig等
├── core/
│   └── file-manager/
│       ├── file-manager.ts       # FileManager クラス
│       ├── file-tree-loader.ts   # FileTreeLoader
│       ├── recovery-manager.ts   # RecoveryManager
│       └── __tests__/
│           ├── file-manager.test.ts
│           ├── file-tree-loader.test.ts
│           └── recovery-manager.test.ts
├── services/
│   └── workspace-service.ts      # WorkspaceService
│       └── __tests__/
│           └── workspace-service.test.ts
├── utils/
│   ├── path-validator.ts         # PathValidator
│   ├── file-name-validator.ts    # FileNameValidator
│   ├── file-watcher-manager.ts   # FileWatcherManager
│   ├── file-tree-virtualizer.ts  # FileTreeVirtualizer
│   ├── focus-trap.ts             # createFocusTrap()
│   ├── atomic-write.ts           # atomicWriteSession()
│   └── __tests__/
│       ├── path-validator.test.ts
│       ├── file-name-validator.test.ts
│       ├── file-watcher-manager.test.ts
│       ├── file-tree-virtualizer.test.ts
│       ├── atomic-write.test.ts
│       └── focus-trap.test.ts
├── stores/
│   ├── workspace.svelte.ts       # ワークスペースストア
│   ├── tabs.svelte.ts            # タブストア
│   └── file-tree.svelte.ts       # ファイルツリーストア
└── components/
    ├── sidebar/
    │   ├── Sidebar.svelte
    │   ├── SidebarHeader.svelte
    │   ├── FileTree.svelte
    │   ├── FileTreeItem.svelte
    │   ├── InlineRenameInput.svelte
    │   └── __tests__/
    │       ├── FileTree.test.ts
    │       └── FileTreeItem.test.ts
    ├── tabs/
    │   ├── TabBar.svelte
    │   ├── TabItem.svelte
    │   └── __tests__/
    │       └── TabBar.test.ts
    ├── editor/
    │   ├── PlainTextEditor.svelte
    │   ├── WelcomeView.svelte
    │   └── StatusBar.svelte
    ├── dialogs/
    │   ├── NewFileDialog.svelte
    │   ├── RecoveryDialog.svelte
    │   └── __tests__/
    │       ├── NewFileDialog.test.ts
    │       └── RecoveryDialog.test.ts
    └── shared/
        ├── ContextMenu.svelte
        └── __tests__/
            └── ContextMenu.test.ts

src/routes/
└── +layout.svelte               # UIShell（サイドバー、タブバー、エディタ統合）
```

---

## U1/U2パターン統合

| U1/U2パターン | U3での適用 |
|---|---|
| U1: FileSystemAdapter抽象化 | 全ファイルI/OをAdapter経由（NFR-U3-18） |
| U1: Result型エラーハンドリング | FileManagerの全メソッドでResult返却 |
| U1: SettingsManager | セッション永続化、自動保存設定 |
| U2: P-U2-02 デバウンス自動保存 | auto/manualモード切替でFileManager.saveFile()連携 |
| U2: R-U2-01 エラー分離 | ファイルI/Oエラーがエディタに影響しない |
| U2: A-U2-01 WAI-ARIA | ツリー/タブ/ダイアログで同レベルのARIA適用 |
| U2: A-U2-02 キーボードナビゲーション | Roving Tabindex をツリー/タブに適用 |
| U2: A-U2-03 ライブリージョン | ファイル操作結果の通知 |
