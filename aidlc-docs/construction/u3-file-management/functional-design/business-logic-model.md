# U3: File Management — ビジネスロジックモデル

## コンポーネント構成

```
WorkspaceService（S2: オーケストレーション）
    ├── FileManager（C2: コアロジック）
    │       ├── ワークスペース管理
    │       ├── ファイルCRUD
    │       ├── タブ管理
    │       └── ファイルツリー構築
    ├── SettingsManager（C7: セッション永続化、U1既存）
    └── FileSystemAdapter（C9: ファイルI/O、U1既存）
```

---

## FileManager ビジネスロジック

### openWorkspace(path: string): Promise\<Result\<Workspace\>\>

```
入力: フォルダの絶対パス
前提条件: パスが存在するディレクトリであること

処理フロー:
  1. パスの存在確認（FileSystemAdapter.exists）
  2. ディレクトリかどうか確認
  3. 現在のワークスペースが開いている場合:
     a. 未保存タブがあればcloseWorkspace()を呼び出し
     b. ユーザーがキャンセルした場合は中断
  4. ルート直下のファイル/フォルダ一覧を取得（FileSystemAdapter.readDir）
  5. DirEntry[] → FileTreeNode[] に変換（buildFileTree）
  6. Workspaceエンティティを生成
  7. ワークスペース状態ストアを更新
  8. RecentWorkspacesに追加/更新
  9. セッション保存（saveSession）

出力: Result<Workspace>
エラー: NOT_FOUND, PERMISSION_DENIED, IO_ERROR
```

### closeWorkspace(): Promise\<boolean\>

```
前提条件: ワークスペースが開いていること

処理フロー:
  1. 未保存タブの一覧を取得
  2. 未保存タブがある場合:
     a. 確認ダイアログ表示（「保存して閉じる」/「保存せず閉じる」/「キャンセル」）
     b. 「保存して閉じる」→ 全未保存タブを保存
     c. 「キャンセル」→ false を返却（閉じない）
  3. セッション保存（saveSession）
  4. 全タブをクローズ
  5. ファイルツリーをクリア
  6. ワークスペース状態をリセット

出力: boolean（閉じたらtrue、キャンセルならfalse）
```

### buildFileTree(dirPath: string): Promise\<FileTreeNode[]\>

```
入力: ディレクトリの絶対パス
前提条件: パスが存在するディレクトリであること

処理フロー:
  1. FileSystemAdapter.readDir(dirPath) で直下のエントリ取得
  2. FileFilterに基づきフィルタリング:
     a. showHiddenFiles=false なら「.」始まりを除外
     b. extensionFilterが設定されていればマッチするもののみ（フォルダは常に表示）
  3. DirEntry → FileTreeNode 変換:
     a. isExpanded: false（初期状態は折り畳み）
     b. isLoaded: false（子は未読み込み）
     c. isSelected: false
  4. ソート:
     a. ディレクトリ優先
     b. 同種内で名前のアルファベット順（大文字小文字無視）
  5. FileTreeNode[] を返却

出力: FileTreeNode[]
注: 再帰はしない。展開時に子ディレクトリのみ読み込み（遅延読み込み）
```

### expandFolder(path: string): Promise\<FileTreeNode[]\>

```
入力: フォルダの絶対パス
前提条件: 対象ノードがisDirectory=trueであること

処理フロー:
  1. 対象ノードの isLoaded を確認
  2. isLoaded=false の場合:
     a. buildFileTree(path) で子ノードを取得
     b. 対象ノードの children を更新
     c. isLoaded = true に設定
  3. isExpanded = true に設定
  4. ファイルツリーストアを更新

出力: FileTreeNode[]（子ノード一覧）
```

### collapseFolder(path: string): void

```
処理: 対象ノードの isExpanded = false に設定
注: childrenはメモリに保持（再展開時のreadDir回避）
```

### createFile(parentPath: string, fileName: string): Promise\<Result\<FileTreeNode\>\>

```
入力: 親ディレクトリパス, ファイル名
前提条件: 親ディレクトリが存在すること

処理フロー:
  1. ファイル名バリデーション（→ビジネスルール参照）
  2. 重複チェック（同名ファイル/フォルダが存在しないか）
  3. FileSystemAdapter.writeFile(fullPath, '') で空ファイル作成
  4. FileTreeNodeを生成してツリーに追加
  5. ファイルツリーストアを更新
  6. 新規ファイルを自動的にタブで開く（openTab）

出力: Result<FileTreeNode>
エラー: ALREADY_EXISTS, PERMISSION_DENIED, IO_ERROR, VALIDATION_ERROR
```

### saveFile(path: string, content: string): Promise\<Result\<void\>\>

```
入力: ファイルパス, 内容
前提条件: ファイルが開かれていること

処理フロー:
  1. 保存ステータスを 'saving' に更新
  2. FileSystemAdapter.writeFile(path, content) で書き込み
  3. 対象タブの isDirty = false に設定
  4. 保存ステータスを 'saved' に更新
  5. セッション保存（saveSession）

出力: Result<void>
エラー: PERMISSION_DENIED, IO_ERROR
エラー時: 保存ステータスを 'error' に更新、通知表示
```

### renameFile(oldPath: string, newName: string): Promise\<Result\<string\>\>

```
入力: 現在のパス, 新しいファイル名
前提条件: ファイル/フォルダが存在すること

処理フロー:
  1. 新ファイル名バリデーション
  2. 新パスを生成（親ディレクトリ + 新ファイル名）
  3. 重複チェック
  4. FileSystemAdapter.rename(oldPath, newPath)
  5. ファイルツリー内の該当ノードを更新
  6. 開いているタブのパスと表示名を更新
  7. ファイルツリーストアを更新

出力: Result<string>（新しいパス）
エラー: ALREADY_EXISTS, NOT_FOUND, PERMISSION_DENIED, VALIDATION_ERROR
```

### deleteFile(path: string): Promise\<Result\<void\>\>

```
入力: ファイル/フォルダの絶対パス
前提条件: パスが存在すること

処理フロー:
  1. 対象がフォルダの場合:
     a. 中身の有無を確認
     b. 確認ダイアログ表示（「フォルダとその中身をすべて削除しますか？」）
  2. 対象がファイルの場合:
     a. 確認ダイアログ表示（「ファイルを削除しますか？」）
  3. ユーザーが確認した場合:
     a. FileSystemAdapter.delete(path, { recursive: true })
     b. ファイルツリーからノード除去
     c. 開いているタブがあればクローズ（未保存警告なし — 削除確認済みのため）
     d. フォルダの場合、配下のファイルのタブもすべてクローズ
  4. ファイルツリーストアを更新

出力: Result<void>
エラー: NOT_FOUND, PERMISSION_DENIED, IO_ERROR
```

### createFolder(parentPath: string, folderName: string): Promise\<Result\<FileTreeNode\>\>

```
入力: 親ディレクトリパス, フォルダ名
前提条件: 親ディレクトリが存在すること

処理フロー:
  1. フォルダ名バリデーション（→ビジネスルール参照）
  2. 重複チェック
  3. FileSystemAdapter.mkdir(fullPath)
  4. FileTreeNodeを生成してツリーに追加
  5. ファイルツリーストアを更新

出力: Result<FileTreeNode>
エラー: ALREADY_EXISTS, PERMISSION_DENIED, IO_ERROR, VALIDATION_ERROR
```

### copyFile(sourcePath: string, destDir: string): Promise\<Result\<string\>\>

```
入力: コピー元パス, コピー先ディレクトリパス

処理フロー:
  1. コピー元の存在確認
  2. コピー先に同名ファイルが存在する場合、連番付与（file(1).md, file(2).md...）
  3. FileSystemAdapter.copyFile(sourcePath, destPath)
  4. ファイルツリー更新

出力: Result<string>（コピー先パス）
```

### moveFile(sourcePath: string, destDir: string): Promise\<Result\<string\>\>

```
入力: 移動元パス, 移動先ディレクトリパス

処理フロー:
  1. 移動元の存在確認
  2. 重複チェック（移動先に同名が存在する場合はエラー）
  3. FileSystemAdapter.rename(sourcePath, destPath)
  4. 開いているタブのパスを更新
  5. ファイルツリー更新（元の場所から削除、新しい場所に追加）

出力: Result<string>（移動先パス）
```

---

## タブ管理ロジック

### openTab(path: string): Promise\<Result\<Tab\>\>

```
入力: ファイルの絶対パス

処理フロー:
  1. 既に同パスのタブが開いている場合 → そのタブをアクティブにして返却
  2. タブ数上限チェック:
     a. 上限到達 → 最も古い isDirty=false のタブを自動クローズ
     b. 全タブが isDirty=true → 通知表示、新規タブ拒否
  3. ファイル読み込み（FileSystemAdapter.readFile）
  4. ファイル種別判定（拡張子から markdown or plaintext）
  5. バイナリ判定（読み込み内容にNULLバイトがあればバイナリ → 拒否+通知）
  6. ワークスペース外ファイルか判定（isExternal）
  7. Tabエンティティ生成:
     a. isDirty: false
     b. isActive: true
     c. cursorState: { cursorPosition: 0, scrollTop: 0, selection: null }
  8. 現在のアクティブタブを非アクティブに
  9. EditorCoreに内容を設定:
     a. markdown → setContent(content)
     b. plaintext → プレーンテキストモードで設定
  10. タブストアを更新
  11. セッション保存

出力: Result<Tab>
エラー: NOT_FOUND, PERMISSION_DENIED, IO_ERROR
```

### closeTab(path: string): Promise\<boolean\>

```
入力: タブのファイルパス

処理フロー:
  1. 対象タブの isDirty チェック
  2. isDirty=true の場合:
     a. 確認ダイアログ（「保存しますか？」→「保存」/「保存しない」/「キャンセル」）
     b. 「保存」→ saveFile → タブクローズ
     c. 「キャンセル」→ false 返却
  3. タブリストから除去
  4. 閉じたタブがアクティブだった場合:
     a. 隣接タブ選択ルール: 右隣 → 左隣 → タブなし
     b. 新アクティブタブの内容をEditorCoreに設定
  5. タブストアを更新
  6. セッション保存

出力: boolean（閉じたらtrue、キャンセルならfalse）
```

### switchTab(path: string): void

```
入力: 切替先タブのファイルパス

処理フロー:
  1. 現在のアクティブタブのEditorCore状態を保存:
     a. cursorPosition = EditorCore.getCursorPosition()
     b. scrollTop = EditorCore.getScrollTop()
     c. content = EditorCore.getMarkdown()（未保存変更がある場合）
  2. 現在タブの isActive = false
  3. 切替先タブの isActive = true
  4. EditorCoreに切替先の内容を設定
  5. EditorCoreにカーソル/スクロール位置を復元:
     a. setCursorPosition(tab.cursorState.cursorPosition)
     b. setScrollTop(tab.cursorState.scrollTop)
  6. タブストアを更新
```

### reorderTabs(fromIndex: number, toIndex: number): void

```
入力: 移動元インデックス, 移動先インデックス
処理: タブ配列内で要素を移動（splice）
出力: なし（ストア更新のみ）
```

### markDirty(path: string): void

```
入力: ファイルパス
処理:
  1. 対象タブの isDirty = true
  2. 保存ステータスを 'unsaved' に更新
  3. タブストアを更新
```

---

## WorkspaceService ビジネスロジック

### initialize(): Promise\<void\>

```
処理フロー:
  1. SettingsManager.get('lastWorkspacePath') で前回のワークスペースパスを取得
  2. パスが存在する場合:
     a. FileManager.openWorkspace(path)
     b. restoreSession()
  3. パスが存在しない/無効な場合:
     a. ウェルカム画面表示（ワークスペース選択促す）
```

### saveSession(): Promise\<void\>

```
処理フロー:
  1. 現在のワークスペースパスを取得
  2. 開いているタブの一覧を取得（パス、カーソル位置、スクロール位置）
  3. アクティブタブのパスを取得
  4. 展開中のフォルダパス一覧を取得
  5. SessionStateエンティティを構築
  6. SettingsManager.set('session', sessionState) で永続化
```

### restoreSession(): Promise\<void\>

```
処理フロー:
  1. SettingsManager.get('session') でSessionStateを取得
  2. SessionStateが存在しない場合: 何もしない
  3. 各タブを順番に復元:
     a. FileManager.openTab(tab.filePath) — ファイルが存在しない場合はスキップ
     b. カーソル位置とスクロール位置を設定
  4. アクティブタブを設定
  5. 展開フォルダを復元（各フォルダを expandFolder）
```

### requestClose(): Promise\<boolean\>

```
処理フロー:
  1. 全タブの isDirty を確認
  2. 未保存タブがない場合: saveSession → true 返却
  3. 未保存タブがある場合:
     a. 確認ダイアログ（「未保存の変更があります。保存しますか？」）
     b. 「すべて保存して閉じる」→ 全未保存タブを保存 → saveSession → true
     c. 「保存せずに閉じる」→ saveSession → true
     d. 「キャンセル」→ false（終了キャンセル）
  4. Tauri の close-requested イベントとの連携
```

---

## 自動保存連携（EditorCore ↔ FileManager）

### 設定切替方式

```typescript
interface AutoSaveConfig {
  /** 自動保存モード */
  mode: 'auto' | 'manual'
  /** 自動保存のデバウンス間隔（ms） */
  debounceMs: number
}
```

### auto モード
- EditorCoreの`onUpdate`コールバックでデバウンス（1000ms）後にFileManager.saveFile()を呼び出し
- ファイルに直接書き込む
- タブのisDirtyは一時的にtrueになり、保存完了後falseに戻る

### manual モード
- EditorCoreの`onUpdate`コールバックではタブのisDirtyをtrueにするのみ
- ファイルへの書き込みはCtrl+Sまたはツールバーの保存ボタンのみ
- タブにisDirtyインジケーター表示

### デフォルト設定
- `mode: 'manual'`（明示的保存がデフォルト）
- `debounceMs: 1000`

---

## クリップボードパス操作

### copyPath(path: string): void

```
処理フロー:
  1. navigator.clipboard.writeText(path)
  2. 通知表示（「パスをコピーしました」）
```

### copyRelativePath(path: string): void

```
処理フロー:
  1. ワークスペースルートからの相対パスを計算
  2. navigator.clipboard.writeText(relativePath)
  3. 通知表示
```
