# U3: File Management — フロントエンドコンポーネント設計

## コンポーネント階層

```
+layout.svelte（UIShell）
├── Sidebar.svelte
│   ├── SidebarHeader.svelte（「+」ボタン、フィルタトグル）
│   ├── FileTree.svelte
│   │   ├── FileTreeItem.svelte（再帰）
│   │   └── InlineRenameInput.svelte
│   └── SidebarFooter.svelte（ワークスペース情報）
├── TabBar.svelte
│   └── TabItem.svelte（D&D対応）
├── EditorArea（条件分岐）
│   ├── EditorContainer.svelte（markdown → 既存U2）
│   ├── PlainTextEditor.svelte（plaintext）
│   └── WelcomeView.svelte（タブなし時）
├── NewFileDialog.svelte
└── ContextMenu.svelte
```

---

## Sidebar.svelte

**責務**: サイドバー全体のレイアウトとワークスペース状態表示

### Props
```typescript
{
  workspace: Workspace | null
  fileFilter: FileFilter
}
```

### State
```typescript
{
  // なし（子コンポーネントに委譲）
}
```

### ユーザーインタラクション
- ワークスペース未選択時: 「フォルダを開く」ボタン表示
- ワークスペース選択済み: FileTree表示

### アクセシビリティ
- `role="complementary"`, `aria-label="ファイルエクスプローラー"`
- リサイズハンドルにaria-label

---

## SidebarHeader.svelte

**責務**: サイドバーヘッダー（ワークスペース名、操作ボタン）

### Props
```typescript
{
  workspaceName: string
  onNewFile: () => void
  onNewFolder: () => void
  onToggleFilter: () => void
  showHiddenFiles: boolean
}
```

### UIレイアウト
```
[ワークスペース名] [+ ▼] [フィルタ] [...]
```
- 「+」ボタン: ドロップダウン（新規ファイル / 新規フォルダ）
- フィルタボタン: 隠しファイル表示切り替え
- 「...」: ワークスペース操作（開く、閉じる、最近のワークスペース）

---

## FileTree.svelte

**責務**: ファイルツリーの表示と操作

### Props
```typescript
{
  nodes: FileTreeNode[]
  selectedPath: string | null
  onSelect: (path: string) => void
  onExpand: (path: string) => void
  onCollapse: (path: string) => void
  onContextMenu: (event: MouseEvent, node: FileTreeNode) => void
}
```

### State
```typescript
{
  // FileTreeNodeの展開/選択状態はストアで管理
}
```

### ユーザーインタラクション
- クリック: ファイル → openTab / フォルダ → 展開/折り畳みトグル
- ダブルクリック: フォルダ → 展開/折り畳みトグル（シングルクリックと同じ）
- 右クリック: コンテキストメニュー表示
- キーボード:
  - `ArrowUp/Down`: ノード間移動
  - `ArrowRight`: フォルダ展開 / ファイルなら何もしない
  - `ArrowLeft`: フォルダ折り畳み / 親フォルダに移動
  - `Enter`: ファイルを開く / フォルダの展開トグル
  - `Delete`: 削除確認ダイアログ
  - `F2`: リネームモード

### アクセシビリティ
- `role="tree"` on container
- `role="treeitem"` on each node
- `aria-expanded` on folders
- `aria-selected` on selected node
- `aria-level` for nesting depth

---

## FileTreeItem.svelte

**責務**: ファイルツリーの個別ノード表示

### Props
```typescript
{
  node: FileTreeNode
  depth: number
  isSelected: boolean
  onSelect: (path: string) => void
  onExpand: (path: string) => void
  onCollapse: (path: string) => void
  onContextMenu: (event: MouseEvent, node: FileTreeNode) => void
}
```

### 表示要素
- インデント（depth × 16px）
- 展開/折り畳みアイコン（フォルダのみ: ▶ / ▼）
- ファイル/フォルダアイコン
- ファイル名
- 選択状態のハイライト

### 再帰レンダリング
- `node.isDirectory && node.isExpanded` の場合、children を再帰的にレンダリング
- `node.isLoaded === false` の場合、展開時にローディングインジケーター表示

---

## InlineRenameInput.svelte

**責務**: ファイルツリー内でのインライン名前入力（新規作成/リネーム）

### Props
```typescript
{
  initialValue: string
  onConfirm: (value: string) => void
  onCancel: () => void
}
```

### 動作
- テキスト入力フィールド表示
- Enter: 確定（onConfirm呼び出し）
- Escape: キャンセル（onCancel呼び出し）
- フォーカスアウト: 確定
- 初期表示時に自動フォーカス + 拡張子以外を全選択

---

## TabBar.svelte

**責務**: タブバーの表示とD&D並び替え

### Props
```typescript
{
  tabs: Tab[]
  onSelectTab: (path: string) => void
  onCloseTab: (path: string) => void
  onReorderTabs: (fromIndex: number, toIndex: number) => void
}
```

### State
```typescript
{
  dragIndex: number | null      // ドラッグ中のタブインデックス
  dropIndex: number | null      // ドロップ先インデックス
}
```

### UIレイアウト
```
[Tab1 ●][Tab2][Tab3 ×] ... [▼ タブ一覧]
```
- ● = 未保存インジケーター
- × = 閉じるボタン（ホバー時に表示、未保存時は●が×に変わる）
- タブが多すぎる場合: 水平スクロール + 「▼ タブ一覧」ドロップダウン

### D&D
- `draggable="true"` on each tab
- dragstart: `dragIndex` 設定
- dragover: `dropIndex` 更新（ドロップ位置インジケーター表示）
- drop: `onReorderTabs(dragIndex, dropIndex)` 呼び出し
- dragend: 状態リセット

### アクセシビリティ
- `role="tablist"` on container
- `role="tab"` on each tab
- `aria-selected` on active tab
- `aria-label` に未保存状態を含む（例: "article.md（未保存）"）

---

## TabItem.svelte

**責務**: 個別タブの表示

### Props
```typescript
{
  tab: Tab
  isActive: boolean
  onSelect: () => void
  onClose: () => void
  draggable: boolean
}
```

### 表示要素
- ファイル名（拡張子含む）
- 未保存インジケーター（●: isDirty=true）
- 閉じるボタン（×）
- アクティブ状態のスタイル（下線/背景色）
- 外部ファイルアイコン（isExternal=true の場合）

---

## PlainTextEditor.svelte

**責務**: プレーンテキストファイルの編集

### Props
```typescript
{
  content: string
  onUpdate: (content: string) => void
}
```

### 動作
- `<textarea>` ベースのシンプルなエディター
- monospaceフォント
- タブキーでインデント挿入（2スペース）
- ツールバー/スラッシュコマンドは無効化（非表示）
- 変更時にonUpdateコールバック

---

## WelcomeView.svelte

**責務**: タブがない時/ワークスペース未選択時の初期画面

### 表示内容

#### ワークスペース未選択時
```
[アプリアイコン]
マークダウンエディター

[フォルダを開く]

最近のワークスペース:
  - workspace1
  - workspace2
  ...
```

#### ワークスペース選択済み、タブなし時
```
ファイルを選択して編集を開始

[サイドバーのファイルツリーからファイルを選択]
[Ctrl+N で新規ファイル作成]
```

---

## NewFileDialog.svelte

**責務**: 新規ファイル/フォルダ作成ダイアログ

### Props
```typescript
{
  isOpen: boolean
  parentPath: string
  mode: 'file' | 'folder'
  onConfirm: (name: string) => void
  onCancel: () => void
}
```

### State
```typescript
{
  fileName: string
  validation: ValidationResult
}
```

### 動作
- ファイル名入力フィールド
- リアルタイムバリデーション（BR-U3-01）
- Enter: 確定
- Escape: キャンセル
- バリデーションエラー時は確定ボタン無効化+エラーメッセージ表示

### アクセシビリティ
- `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` でタイトル参照
- フォーカストラップ

---

## ContextMenu.svelte

**責務**: ファイルツリーのコンテキストメニュー

### Props
```typescript
{
  isOpen: boolean
  position: { x: number; y: number }
  targetNode: FileTreeNode | null
  onAction: (action: ContextMenuAction) => void
  onClose: () => void
}
```

### メニュー項目

#### ファイル選択時
| アクション | ラベル | ショートカット |
|---|---|---|
| newFile | 新規ファイル | |
| newFolder | 新規フォルダ | |
| separator | --- | |
| rename | 名前を変更 | F2 |
| delete | 削除 | Delete |
| separator | --- | |
| copyPath | パスをコピー | |
| copyRelativePath | 相対パスをコピー | |
| separator | --- | |
| copyFile | コピー | Ctrl+C |
| moveFile | 移動... | |

#### フォルダ選択時
（上記に加えて）
| アクション | ラベル |
|---|---|
| newFileInFolder | このフォルダに新規ファイル |
| newFolderInFolder | このフォルダに新規フォルダ |

### 動作
- 右クリック位置に表示
- クリック外で閉じる
- キーボード: ArrowUp/Down で移動、Enter で実行、Escape で閉じる

### アクセシビリティ
- `role="menu"` on container
- `role="menuitem"` on each item
- `aria-disabled` on disabled items

---

## ストア設計

### workspace.svelte.ts

```typescript
interface WorkspaceState {
  workspace: Workspace | null
  isLoading: boolean
  recentWorkspaces: RecentWorkspace[]
}

// $state ベース
export const workspaceState: WorkspaceState = $state({
  workspace: null,
  isLoading: false,
  recentWorkspaces: []
})
```

### tabs.svelte.ts

```typescript
interface TabsState {
  tabs: Tab[]
  activeTabPath: string | null
  maxTabs: number
}

// $state ベース
export const tabsState: TabsState = $state({
  tabs: [],
  activeTabPath: null,
  maxTabs: 20
})

// $derived
export const activeTab = $derived(
  tabsState.tabs.find(t => t.filePath === tabsState.activeTabPath) ?? null
)

export const dirtyTabs = $derived(
  tabsState.tabs.filter(t => t.isDirty)
)

export const hasDirtyTabs = $derived(dirtyTabs.length > 0)
```

### file-tree.svelte.ts

```typescript
interface FileTreeState {
  nodes: FileTreeNode[]
  selectedPath: string | null
  filter: FileFilter
}

// $state ベース
export const fileTreeState: FileTreeState = $state({
  nodes: [],
  selectedPath: null,
  filter: {
    showHiddenFiles: false,
    extensionFilter: [],
    isFilterActive: false
  }
})
```

---

## コンポーネント間データフロー

```
ユーザー操作
    │
    ▼
UIコンポーネント（FileTree, TabBar, etc.）
    │ イベント発火
    ▼
FileManager / WorkspaceService（ビジネスロジック）
    │ ストア更新
    ▼
Svelte 5 $state ストア（workspace, tabs, fileTree）
    │ リアクティブ更新
    ▼
UIコンポーネント（自動再レンダリング）
```

### EditorCore連携
```
TabBar.switchTab(path)
    → FileManager.switchTab(path)
        → EditorCore.getMarkdown()（現在タブの内容保存）
        → EditorCore.setContent(newContent)（新タブの内容設定）
        → EditorCore.setCursorPosition(pos)（カーソル復元）
        → EditorCore.setScrollTop(top)（スクロール復元）
```
