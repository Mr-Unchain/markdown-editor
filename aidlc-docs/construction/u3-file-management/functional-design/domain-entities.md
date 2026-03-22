# U3: File Management — ドメインエンティティ

## エンティティ一覧

| エンティティ | 責務 | ライフサイクル |
|---|---|---|
| Workspace | ワークスペース（フォルダ）の状態管理 | アプリ起動〜終了 |
| FileTreeNode | ファイルツリーの各ノード（ファイル/フォルダ） | ワークスペース開閉 |
| Tab | 開いているファイルのタブ状態 | ファイル開く〜タブ閉じ |
| TabCursorState | タブごとのカーソル/スクロール位置 | タブ存在中 |
| SessionState | セッション復元用の永続化状態 | 保存〜次回復元 |
| RecentWorkspace | 最近開いたワークスペースの記録 | 永続 |
| FileFilter | ファイルツリーのフィルタ設定 | アプリ起動〜終了 |

---

## Workspace

```typescript
interface Workspace {
  /** ワークスペースルートの絶対パス */
  rootPath: string
  /** ワークスペース名（フォルダ名） */
  name: string
  /** ファイルツリーのルートノード */
  fileTree: FileTreeNode[]
  /** ワークスペースが開かれているか */
  isOpen: boolean
}
```

### 状態遷移
```
closed → opening → open → closing → closed
```

- `closed`: ワークスペース未選択
- `opening`: フォルダ選択後、ファイルツリー読み込み中
- `open`: ファイルツリー読み込み完了、操作可能
- `closing`: 未保存チェック中、セッション保存中

---

## FileTreeNode

```typescript
interface FileTreeNode {
  /** ファイル/フォルダ名 */
  name: string
  /** 絶対パス */
  path: string
  /** ディレクトリかどうか */
  isDirectory: boolean
  /** 子ノード（ディレクトリの場合） */
  children: FileTreeNode[]
  /** フォルダの展開/折り畳み状態 */
  isExpanded: boolean
  /** 子ノードが読み込み済みか（遅延読み込み用） */
  isLoaded: boolean
  /** 現在選択されているか */
  isSelected: boolean
}
```

### DirEntry（U1既存）との関係
- `DirEntry`（U1 filesystem.ts）はファイルシステムからの生データ
- `FileTreeNode`は`DirEntry`に表示状態（展開/選択/読み込み済み）を付加したUI向けエンティティ
- 変換: `DirEntry → FileTreeNode`（buildFileTree時に変換）

### ソート順
1. ディレクトリが先、ファイルが後
2. 同種内ではアルファベット順（大文字小文字無視）

### 遅延読み込み
- ファイルツリーは再帰深度制限なし
- 初期表示時はルート直下のみ読み込み（`isLoaded: false`）
- フォルダ展開時に子ノードを読み込み（`isLoaded: true`）
- パフォーマンス確保のため、大量ファイル（1000+）のフォルダは警告表示

---

## Tab

```typescript
interface Tab {
  /** ファイルの絶対パス（一意キー） */
  filePath: string
  /** 表示名（ファイル名） */
  displayName: string
  /** ファイル内容（メモリ上） */
  content: string
  /** 未保存の変更があるか */
  isDirty: boolean
  /** このタブがアクティブか */
  isActive: boolean
  /** ファイル種別 */
  fileType: 'markdown' | 'plaintext'
  /** カーソル/スクロール位置 */
  cursorState: TabCursorState
  /** ワークスペース外ファイルか */
  isExternal: boolean
}
```

### タブ最大数
- デフォルト: 20タブ
- 設定で変更可能（`AppSettings.editor.maxTabs`）
- 上限到達時: 最も古い未変更タブを自動クローズ（全タブが未保存の場合は新規タブ拒否+通知）

### ファイル種別判定
- `.md`, `.mdx` → `'markdown'`（WYSIWYGモード）
- その他テキストファイル → `'plaintext'`（プレーンテキストモード）
- バイナリファイル → 開けない（通知表示）

### ワークスペース外ファイル
- `isExternal: true` のタブは保存時にワークスペース内へコピー
- コピー先はワークスペースルート直下（同名ファイルがある場合は連番付与）

---

## TabCursorState

```typescript
interface TabCursorState {
  /** カーソル位置（ProseMirrorのPosition） */
  cursorPosition: number
  /** スクロール位置（px） */
  scrollTop: number
  /** 選択範囲（あれば） */
  selection: { from: number; to: number } | null
}
```

- タブ切替時にEditorCoreから取得して保存
- タブ復帰時にEditorCoreに復元

---

## SessionState

```typescript
interface SessionState {
  /** ワークスペースパス */
  workspacePath: string | null
  /** 開いていたタブのパス一覧（順序保持） */
  openTabs: SessionTab[]
  /** アクティブだったタブのパス */
  activeTabPath: string | null
  /** サイドバーの展開フォルダパス一覧 */
  expandedFolders: string[]
}

interface SessionTab {
  /** ファイルパス */
  filePath: string
  /** カーソル位置 */
  cursorPosition: number
  /** スクロール位置 */
  scrollTop: number
}
```

### 永続化タイミング
- タブ開閉時
- タブ切替時
- ファイル保存時
- アプリ終了時（requestClose）
- SettingsManagerを通じてJSONファイルに保存

---

## RecentWorkspace

```typescript
interface RecentWorkspace {
  /** ワークスペースパス */
  path: string
  /** ワークスペース名 */
  name: string
  /** 最終アクセス日時（ISO 8601） */
  lastAccessedAt: string
}
```

- 最大保持数: 10件
- 保存先: SettingsManager経由（`AppSettings.recentWorkspaces`を`RecentWorkspace[]`に拡張）

---

## FileFilter

```typescript
interface FileFilter {
  /** 隠しファイルを表示するか */
  showHiddenFiles: boolean
  /** 表示するファイル拡張子フィルタ（空配列=全表示） */
  extensionFilter: string[]
  /** フィルタが有効か */
  isFilterActive: boolean
}
```

### デフォルト設定
- `showHiddenFiles: false`（`.`で始まるファイル/フォルダを非表示）
- `extensionFilter: []`（全ファイル表示）
- `isFilterActive: false`

### フィルタリング対象の定義
- 隠しファイル: 名前が`.`で始まるファイル/フォルダ（例: `.git`, `.DS_Store`）
- 拡張子フィルタ: ユーザーが指定した拡張子のみ表示（例: `['md', 'mdx']`）
