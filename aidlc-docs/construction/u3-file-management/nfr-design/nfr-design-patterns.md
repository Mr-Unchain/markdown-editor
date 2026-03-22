# U3: File Management — NFR Design Patterns

## パフォーマンスパターン

### P-U3-01: 遅延ファイルツリー読み込み
**対応NFR**: NFR-U3-01（ファイルツリー読み込み速度）

**パターン概要**: ファイルツリーはルート直下のみ初回読み込み、サブフォルダは展開時にオンデマンドで読み込む。

**設計**:
```typescript
class FileTreeLoader {
  /**
   * ルート直下のエントリのみ読み込み（初回）
   * - isLoaded: false（子は未読み込み）
   * - isExpanded: false（折り畳み状態）
   */
  async loadRootEntries(rootPath: string): Promise<FileTreeNode[]>

  /**
   * フォルダ展開時に子ノードをオンデマンド読み込み
   * - 読み込み完了後 isLoaded: true に設定
   * - 既に isLoaded: true ならキャッシュを返却（再読み込みしない）
   */
  async loadChildren(folderPath: string): Promise<FileTreeNode[]>

  /**
   * 強制再読み込み（外部変更検出時）
   * - isLoaded をリセットして再取得
   */
  async reloadChildren(folderPath: string): Promise<FileTreeNode[]>
}
```

**フィルタリング・ソート**: クライアントサイドで実行（≤ 16ms）
```typescript
function applyFilter(nodes: FileTreeNode[], filter: FileFilter): FileTreeNode[] {
  return nodes
    .filter(node => {
      if (node.isDirectory) return filter.showHiddenFiles || !node.name.startsWith('.')
      if (!filter.showHiddenFiles && node.name.startsWith('.')) return false
      if (filter.extensionFilter.length > 0) {
        const ext = node.name.split('.').pop() ?? ''
        return filter.extensionFilter.includes(ext)
      }
      return true
    })
    .sort(sortNodes)
}

function sortNodes(a: FileTreeNode, b: FileTreeNode): number {
  // ディレクトリ優先
  if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
  // 同種内はロケール対応アルファベット順
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}
```

---

### P-U3-02: タブコンテンツキャッシュ
**対応NFR**: NFR-U3-03（タブ切替速度 ≤ 100ms）

**パターン概要**: タブ切替時にファイルを再読み込みせず、メモリ上のコンテンツキャッシュを使用。カーソル/スクロール位置も保持。

**設計**:
```typescript
/**
 * タブ切替フロー（≤ 100ms ターゲット）
 *
 * 1. 現タブの状態保存（~10ms）
 *    - EditorCore.getMarkdown() → tab.content
 *    - EditorCore.getCursorPosition() → tab.cursorState.cursorPosition
 *    - EditorCore.getScrollTop() → tab.cursorState.scrollTop
 *
 * 2. 新タブの内容設定（~80ms）
 *    - EditorCore.setContent(newTab.content)
 *    - EditorCore.setCursorPosition(newTab.cursorState.cursorPosition)
 *    - EditorCore.setScrollTop(newTab.cursorState.scrollTop)
 *
 * 3. ストア更新（~10ms）
 *    - 旧タブ isActive = false
 *    - 新タブ isActive = true
 */
```

**メモリ管理**:
- 各タブがコンテンツを文字列として保持（最大1MB × 20タブ = 最大20MB）
- タブ上限（デフォルト20）でメモリ使用量を間接的に制限
- タブクローズ時にコンテンツ参照を解放

---

### P-U3-03: 仮想スクロール
**対応NFR**: NFR-U3-05（仮想スクロール 60fps）

**パターン概要**: 200+エントリのフォルダで仮想スクロールを発動。ツリーをフラット化した可視ノードリストから表示範囲のみDOMレンダリング。

**設計**:
```typescript
class FileTreeVirtualizer {
  /** 固定アイテム高さ（px） */
  private readonly ITEM_HEIGHT = 28

  /** 上下バッファノード数 */
  private readonly BUFFER_SIZE = 20

  /** フラット化された可視ノードリスト */
  private flatNodes: FileTreeNode[] = []

  /**
   * ツリーをフラット化（展開済みノードのみ）
   * - 展開されたフォルダの子ノードを再帰的に含める
   * - 折り畳まれたフォルダの子は含めない
   */
  flatten(roots: FileTreeNode[]): FileTreeNode[]

  /**
   * スクロール位置から表示範囲を計算
   * @returns { startIndex, endIndex, offsetY }
   */
  getVisibleRange(scrollTop: number, containerHeight: number): VisibleRange

  /**
   * 表示範囲のノードのみ返却（バッファ含む）
   */
  getVisibleNodes(range: VisibleRange): FileTreeNode[]

  /**
   * 全体の高さ（スクロールバー用）
   */
  getTotalHeight(): number
}

interface VisibleRange {
  startIndex: number
  endIndex: number
  offsetY: number  // transform: translateY 用
}
```

**発動条件**:
- 1フォルダ内のエントリ数が200を超えた場合のみ
- 200以下の場合は通常のDOMレンダリング（パフォーマンス十分）

**実装制約**:
- 全ノード固定高さ28px（CSSで統一）
- 展開/折り畳み時にflatNodesを再計算

---

### P-U3-04: セッション遅延復元
**対応NFR**: NFR-U3-04（起動時初期表示 ≤ 500ms）

**パターン概要**: 起動時はアクティブタブのみ読み込み、他タブは初回切替時に遅延読み込み。

**設計**:
```typescript
/**
 * セッション復元フロー
 *
 * Phase 1: 即時復元（≤ 200ms）— 起動時実行
 *   1. SettingsManager.get('session') → SessionState読込（50ms）
 *   2. FileManager.openWorkspace(path)（100ms）
 *   3. アクティブタブの skeletal Tab 生成（タブバー表示用、content未読込）
 *
 * Phase 2: アクティブタブ読込（≤ 200ms）— Phase 1直後
 *   4. アクティブタブのファイル読込 + EditorCore設定
 *   5. カーソル/スクロール位置復元
 *
 * Phase 3: 非アクティブタブ（遅延）— 初回切替時
 *   6. 各タブは skeletal 状態（filePath + displayName のみ）
 *   7. switchTab() 時にファイル読込 + content設定
 */

interface SkeletalTab {
  filePath: string
  displayName: string
  isDirty: false
  isActive: false
  fileType: 'markdown' | 'plaintext'
  /** content は null = 未読込 */
  content: string | null
  cursorState: TabCursorState
  isExternal: false
}
```

---

### P-U3-05: ファイル監視デバウンス
**対応NFR**: NFR-U3-06（変更検出 ≤ 2,000ms, デバウンス 500ms）

**パターン概要**: ファイル監視イベントを2層（ツリー用全体監視 + タブ用個別監視）に分離し、デバウンスで効率化。

**設計**:
```typescript
class FileWatcherManager {
  /** Layer 1: ワークスペース全体の再帰監視（ツリー更新用） */
  private workspaceWatcher: UnwatchFn | null = null

  /** Layer 2: 開いているタブのファイル個別監視（内容更新用） */
  private tabWatchers: Map<string, UnwatchFn> = new Map()

  /**
   * ワークスペース全体監視を開始
   * - 起動完了後に非同期で開始（起動時間に影響しない）
   * - debounce: 500ms（git操作等の連続変更をまとめる）
   * - イベント: ファイル作成/削除/リネーム → ファイルツリー再構築
   */
  async startWorkspaceWatch(rootPath: string): Promise<void>

  /**
   * タブファイル個別監視を追加
   * - タブオープン時に開始、クローズ時に停止
   * - debounce: 500ms
   * - イベント: ファイル内容変更 → 競合解決フロー（R-U3-03）
   */
  async watchTabFile(filePath: string): Promise<void>

  /**
   * タブファイル監視を停止
   */
  async unwatchTabFile(filePath: string): Promise<void>

  /**
   * 全監視を停止（ワークスペースクローズ時）
   */
  async stopAll(): Promise<void>
}
```

**イベント処理フロー**:
```
Layer 1（ツリー更新）:
  外部ファイル作成/削除/リネーム
    → debounce 500ms
    → 該当フォルダの子ノード再読み込み
    → ファイルツリーストア更新

Layer 2（タブ内容更新）:
  外部ファイル内容変更
    → debounce 500ms
    → R-U3-03 競合解決フロー発動
```

---

## 信頼性パターン

### R-U3-01: クラッシュリカバリ
**対応NFR**: NFR-U3-08（未保存変更の保護）

**パターン概要**: 30秒間隔で未保存タブのコンテンツをリカバリファイルに書き出し。起動時にリカバリファイルの存在をチェックして復旧を提案。

**設計**:
```typescript
class RecoveryManager {
  private readonly INTERVAL_MS = 30_000
  private readonly RECOVERY_DIR = '.markdown-editor-recovery'
  private intervalId: ReturnType<typeof setInterval> | null = null

  /**
   * リカバリ監視を開始
   * - manualモードの場合のみ動作（autoモードではisDirtyが常にfalseのため不要）
   * - 30秒間隔で全未保存タブをスキャン
   */
  start(): void {
    this.intervalId = setInterval(() => this.writeRecoveryFiles(), this.INTERVAL_MS)
  }

  /**
   * リカバリファイルを書き出し
   * - 保存先: {workspace}/.markdown-editor-recovery/{filename}.recovery
   * - isDirty=true のタブのみ対象
   * - FileSystemAdapter経由で書き込み
   */
  private async writeRecoveryFiles(): Promise<void>

  /**
   * 起動時チェック
   * - リカバリファイルの存在を確認
   * - 見つかった場合: 復旧ダイアログ表示
   *   - 「復旧する」→ リカバリファイルの内容でタブを開く
   *   - 「破棄する」→ リカバリファイルを削除
   */
  async checkAndRecover(workspacePath: string): Promise<RecoveryFile[]>

  /**
   * リカバリファイルを適用
   */
  async applyRecovery(recoveryFile: RecoveryFile): Promise<void>

  /**
   * クリーンアップ
   * - 正常保存後: 該当ファイルのリカバリを削除
   * - 正常終了時: 全リカバリファイルを削除
   */
  async cleanup(filePath?: string): Promise<void>

  /**
   * 停止
   */
  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}

interface RecoveryFile {
  originalPath: string
  recoveryPath: string
  content: string
  timestamp: number
}
```

**autoモードとの排他制御**:
- `autoSaveConfig.mode === 'auto'` → RecoveryManager.start() を呼ばない
- `autoSaveConfig.mode === 'manual'` → RecoveryManager.start() を呼ぶ
- モード切替時にRecoveryManagerも開始/停止を切替

---

### R-U3-02: アトミックセッション保存
**対応NFR**: NFR-U3-09（セッション永続化の信頼性）

**パターン概要**: セッション情報をアトミックに書き込み（一時ファイル→リネーム）、書き込み中のクラッシュでもデータを失わない。

**設計**:
```typescript
/**
 * アトミック書き込みパターン
 *
 * 1. 現在のセッションファイルを .bak にコピー
 * 2. 一時ファイル（.tmp）に新しい内容を書き込み
 * 3. 一時ファイルをセッションファイルにリネーム（アトミック操作）
 *
 * クラッシュ時の復旧:
 * - Step 2 でクラッシュ → .bak から復元
 * - Step 3 でクラッシュ → .bak から復元（リネームはOS保証でアトミック）
 */
async function atomicWriteSession(
  sessionPath: string,
  data: SessionState,
  fs: FileSystemAdapter
): Promise<Result<void>> {
  const bakPath = sessionPath + '.bak'
  const tmpPath = sessionPath + '.tmp'

  // 1. バックアップ
  if (await fs.exists(sessionPath)) {
    await fs.copyFile(sessionPath, bakPath)
  }

  // 2. 一時ファイルに書き込み
  const json = JSON.stringify(data, null, 2)
  const writeResult = await fs.writeFile(tmpPath, json)
  if (!writeResult.ok) return writeResult

  // 3. アトミックリネーム
  return await fs.rename(tmpPath, sessionPath)
}
```

---

### R-U3-03: 外部変更競合解決
**対応NFR**: NFR-U3-10（外部変更検出と競合解決）

**パターン概要**: 外部でファイルが変更された場合、タブの編集状態に応じて自動更新または確認ダイアログを表示。

**設計**:
```typescript
/**
 * 競合解決フロー
 *
 * Layer 2（タブファイル監視）からのイベント受信時:
 *
 * Case 1: タブが未編集（isDirty = false）
 *   → 自動的に最新内容に更新
 *   → 通知「{filename} が外部で更新されました」（aria-live="polite"）
 *   → EditorCore.setContent(newContent)
 *
 * Case 2: タブが編集中（isDirty = true）
 *   → 確認ダイアログ表示:
 *     「{filename} が外部で変更されました」
 *     - 「外部の変更を読み込む」→ 外部内容で上書き、isDirty = false
 *     - 「ローカルの変更を保持」→ 外部変更を無視、isDirty = true のまま
 *
 * Case 3: ファイルが外部で削除された
 *   → タブにWarningアイコン表示
 *   → 通知「{filename} が削除されました」
 *   → 保存時に「名前を付けて保存」ダイアログ表示
 */

type ConflictAction = 'reload' | 'keep-local'

async function resolveConflict(
  tab: Tab,
  externalContent: string | null  // null = 削除された
): Promise<void>
```

---

### R-U3-04: ファイルI/Oエラーハンドリング
**対応NFR**: NFR-U3-07（ファイルシステムエラーハンドリング）

**パターン概要**: 全ファイルI/O操作でResult型を使用、リトライなし即座にエラー返却、Toast通知。

**設計**:
```typescript
/**
 * エラーハンドリングパターン（U1 NFR-U1-05準拠）
 *
 * 1. FileSystemAdapter → Result<T> を返却
 * 2. FileManager → Result をチェック、エラー時は通知
 * 3. UIコンポーネント → ストア経由で通知受信
 *
 * リトライなし: ファイルI/Oは一時的な障害が少ないため即座にエラー返却
 */

function handleFileError(error: FileSystemError, context: string): void {
  const messages: Record<FileSystemErrorCode, string> = {
    NOT_FOUND: 'ファイルが見つかりません',
    PERMISSION_DENIED: 'アクセス権限がありません',
    ALREADY_EXISTS: '同名のファイルが既に存在します',
    NOT_DIRECTORY: 'ディレクトリではありません',
    NOT_FILE: 'ファイルではありません',
    IO_ERROR: 'ファイルの読み書きに失敗しました',
    UNKNOWN: '予期しないエラーが発生しました',
  }

  showNotification({
    type: 'error',
    message: `${context}: ${messages[error.code]}`,
    detail: error.path,
  })
}
```

---

## セキュリティパターン

### S-U3-01: パストラバーサル多層防御
**対応NFR**: NFR-U3-11（パストラバーサル防止）

**設計**:
```typescript
class PathValidator {
  constructor(private workspaceRoot: string) {}

  /**
   * Layer 1: FileManagerレベル検証
   * - パスを正規化（resolve）
   * - ワークスペースルート配下であることを確認
   * - '..' セグメントの検出と拒否
   * - シンボリックリンクのフォロー禁止
   */
  validatePath(targetPath: string): Result<string> {
    const normalized = path.resolve(targetPath)

    // ワークスペースルート配下チェック
    if (!normalized.startsWith(this.workspaceRoot + path.sep) &&
        normalized !== this.workspaceRoot) {
      return err(new FileSystemError('PERMISSION_DENIED',
        'ワークスペース外のパスにはアクセスできません', targetPath))
    }

    // '..' チェック（正規化後も念のため）
    if (targetPath.includes('..')) {
      return err(new FileSystemError('PERMISSION_DENIED',
        '相対パスの上位参照は許可されていません', targetPath))
    }

    return ok(normalized)
  }

  /**
   * Windows代替データストリームのブロック
   */
  validateNoADS(targetPath: string): Result<void> {
    if (targetPath.includes(':') && !targetPath.match(/^[A-Za-z]:\\/)) {
      return err(new FileSystemError('PERMISSION_DENIED',
        '代替データストリームは許可されていません', targetPath))
    }
    return ok(undefined)
  }
}
```

**Layer 2: FileSystemAdapterレベル**:
- 全I/Oメソッドの先頭で `PathValidator.validatePath()` を呼び出し
- FileManagerとFileSystemAdapterの両方で検証（ダブルチェック）

**Layer 3: Tauriスコープ**:
```json
// tauri.conf.json (概念)
{
  "plugins": {
    "fs": {
      "scope": {
        "allow": ["$WORKSPACE/**"]
      }
    }
  }
}
```
- ワークスペース変更時に動的スコープ更新

---

### S-U3-02: ファイル名サニタイズ
**対応NFR**: NFR-U3-12（ファイル名サニタイズ）

**設計**:
```typescript
class FileNameValidator {
  private static readonly FORBIDDEN_CHARS = /[\\/:*?"<>|]/
  private static readonly CONTROL_CHARS = /[\x00-\x1f]/
  private static readonly RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ])
  private static readonly MAX_NAME_LENGTH = 255
  private static readonly MAX_PATH_LENGTH = 260

  static validate(name: string, parentPath: string): ValidationResult {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'EMPTY', message: 'ファイル名を入力してください' }
    }
    if (name.length > this.MAX_NAME_LENGTH) {
      return { isValid: false, error: 'TOO_LONG', message: 'ファイル名が長すぎます（最大255文字）' }
    }
    if (this.FORBIDDEN_CHARS.test(name)) {
      return { isValid: false, error: 'INVALID_CHARS', message: '使用できない文字が含まれています: \\ / : * ? " < > |' }
    }
    if (this.CONTROL_CHARS.test(name)) {
      return { isValid: false, error: 'INVALID_CHARS', message: '制御文字は使用できません' }
    }
    if (name.startsWith('.') || name.endsWith('.') || name.startsWith(' ') || name.endsWith(' ')) {
      return { isValid: false, error: 'INVALID_CHARS', message: '先頭・末尾にドットやスペースは使用できません' }
    }
    const baseName = name.replace(/\.[^.]*$/, '').toUpperCase()
    if (this.RESERVED_NAMES.has(baseName)) {
      return { isValid: false, error: 'RESERVED_NAME', message: 'この名前はシステムで予約されています' }
    }
    const fullPath = parentPath + '/' + name
    if (fullPath.length > this.MAX_PATH_LENGTH) {
      return { isValid: false, error: 'PATH_TOO_LONG', message: 'パス全体が長すぎます（最大260文字）' }
    }
    return { isValid: true }
  }

  /**
   * UI表示時のHTML/スクリプトインジェクション防止
   * - Svelte のテンプレート内で {name} を使用すれば自動エスケープ
   * - {@html} は使用しない
   */
}
```

---

## アクセシビリティパターン

### A-U3-01: ツリーウィジェットパターン
**対応NFR**: NFR-U3-14（WCAG 2.1 AAA ファイルツリー）

**パターン概要**: WAI-ARIA Tree View パターンに準拠したファイルツリー実装。

**ARIA構造**:
```html
<div role="tree" aria-label="ファイルエクスプローラー">
  <div role="treeitem" aria-level="1" aria-expanded="true" aria-selected="false"
       tabindex="0">
    📁 src
    <div role="group">
      <div role="treeitem" aria-level="2" aria-selected="true" tabindex="-1">
        📄 index.md
      </div>
    </div>
  </div>
</div>
```

**キーボードナビゲーション**:
```typescript
function handleTreeKeydown(event: KeyboardEvent, tree: TreeState): void {
  switch (event.key) {
    case 'ArrowDown': moveFocus('next'); break
    case 'ArrowUp': moveFocus('prev'); break
    case 'ArrowRight':
      if (focused.isDirectory && !focused.isExpanded) expandFolder(focused)
      else if (focused.isDirectory && focused.isExpanded) moveFocus('firstChild')
      break
    case 'ArrowLeft':
      if (focused.isDirectory && focused.isExpanded) collapseFolder(focused)
      else moveFocus('parent')
      break
    case 'Enter': openItem(focused); break
    case 'Home': moveFocus('first'); break
    case 'End': moveFocus('last'); break
    case '*': expandAllSiblings(focused); break
    case 'F2': startRename(focused); break
    case 'Delete': confirmDelete(focused); break
    default:
      // Type-ahead: 文字入力でマッチするノードにフォーカス
      if (event.key.length === 1) typeAheadSearch(event.key)
  }
}
```

**Roving Tabindex**: ツリー内の1つのノードのみ `tabindex="0"`、他は `tabindex="-1"`

---

### A-U3-02: タブウィジェットパターン
**対応NFR**: NFR-U3-15（WCAG 2.1 AAA タブバー）

**ARIA構造**:
```html
<div role="tablist" aria-label="開いているファイル">
  <button role="tab" aria-selected="true" aria-controls="panel-0"
          id="tab-0" tabindex="0"
          aria-label="article.md">
    article.md
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-1"
          id="tab-1" tabindex="-1"
          aria-label="draft.md（未保存の変更があります）">
    draft.md ●
  </button>
</div>
<div role="tabpanel" id="panel-0" aria-labelledby="tab-0">
  <!-- EditorContainer -->
</div>
```

**キーボードナビゲーション**:
```typescript
function handleTabListKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft': focusPrevTab(); break
    case 'ArrowRight': focusNextTab(); break
    case 'Home': focusFirstTab(); break
    case 'End': focusLastTab(); break
    case 'Delete': closeCurrentTab(); break
  }
  // D&Dキーボード代替
  if (event.ctrlKey && event.shiftKey) {
    switch (event.key) {
      case 'ArrowLeft': moveTabLeft(); break
      case 'ArrowRight': moveTabRight(); break
    }
  }
}
```

---

### A-U3-03: ダイアログ/メニューパターン
**対応NFR**: NFR-U3-16（WCAG 2.1 AAA ダイアログ/コンテキストメニュー）

**ダイアログ（フォーカストラップ）**:
```typescript
function createFocusTrap(dialogElement: HTMLElement): {
  activate: () => void
  deactivate: () => void
} {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

  return {
    activate() {
      const focusable = dialogElement.querySelectorAll(focusableSelectors)
      const first = focusable[0] as HTMLElement
      const last = focusable[focusable.length - 1] as HTMLElement

      dialogElement.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus()
          }
        }
        if (e.key === 'Escape') closeDialog()
      })

      first?.focus()
    },
    deactivate() {
      // 元のフォーカス元に戻す
    }
  }
}
```

**コンテキストメニュー**:
```typescript
function handleMenuKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown': focusNextItem(); break
    case 'ArrowUp': focusPrevItem(); break
    case 'Enter': executeItem(); break
    case 'Escape': closeMenu(); break
    case 'Home': focusFirstItem(); break
    case 'End': focusLastItem(); break
  }
}
```

**ライブリージョン**: ファイル操作結果の通知
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- 動的に更新: "article.md を保存しました" -->
</div>
```

---

## パフォーマンスパターン（追加）

### P-U3-06: ファイル操作パフォーマンスガイドライン
**対応NFR**: NFR-U3-02（ファイル操作レスポンス）

**パターン概要**: 全ファイル操作はFileSystemAdapter経由の単一I/O呼び出しで完結させ、追加処理（ストア更新、通知）は非同期で実行。

**設計**:
```typescript
/**
 * ファイル操作のパフォーマンス確保パターン
 *
 * 原則: I/O操作 + ストア更新を分離
 *   1. I/O操作（FileSystemAdapter呼び出し）— ブロッキング、Result返却
 *   2. ストア更新 + 通知 — I/O成功後に同期実行（≤ 10ms）
 *   3. セッション保存 — 非同期（バックグラウンド、UIブロックしない）
 *
 * クロスドライブ移動の検出:
 *   - rename() が EXDEV エラーを返した場合 → copyFile + delete にフォールバック
 *   - パフォーマンス目標: 同ドライブ ≤ 100ms、クロスドライブ ≤ 500ms
 */
```

---

## セキュリティパターン（追加）

### S-U3-03: 外部ファイルインポート安全性チェック
**対応NFR**: NFR-U3-13（外部ファイルインポートの安全性）

**設計**:
```typescript
/**
 * インポート前の安全性チェックチェーン
 *
 * 1. ファイルサイズ確認（≤ 1MB、U2準拠）
 * 2. シンボリックリンク検出（fs.lstat でチェック、リンクなら拒否）
 * 3. バイナリファイル検出（先頭8KBを読み込み、NULLバイト(0x00)を含むなら拒否）
 * 4. パス検証（PathValidator経由）
 */
async function validateImportFile(
  filePath: string,
  fs: FileSystemAdapter
): Promise<Result<void>> {
  // 1. サイズチェック
  const info = await fs.getFileInfo(filePath)
  if (!info.ok) return info
  if (info.value.size > 1_048_576) {
    return err(new FileSystemError('IO_ERROR', 'ファイルサイズが上限（1MB）を超えています'))
  }

  // 2. シンボリックリンクチェック
  if (info.value.isSymlink) {
    return err(new FileSystemError('PERMISSION_DENIED', 'シンボリックリンクは開けません'))
  }

  // 3. バイナリチェック（先頭8KB）
  const head = await fs.readFilePartial(filePath, 0, 8192)
  if (head.ok && containsNullByte(head.value)) {
    return err(new FileSystemError('IO_ERROR', 'バイナリファイルは開けません'))
  }

  return ok(undefined)
}

function containsNullByte(data: Uint8Array): boolean {
  return data.includes(0x00)
}
```

---

## 保守性パターン

### M-U3-01: テスト戦略
**対応NFR**: NFR-U3-17（コード品質）

**設計**:
```
テスト階層:
├── ユニットテスト（Vitest）
│   ├── FileManager: CRUD操作、タブ管理、エラーハンドリング
│   ├── WorkspaceService: 初期化、セッション復元、requestClose
│   ├── PathValidator: パストラバーサル各種ケース
│   ├── FileNameValidator: 禁止文字、予約名、最大長
│   ├── FileTreeLoader: フィルタ、ソート、遅延読み込み
│   ├── FileTreeVirtualizer: フラット化、可視範囲計算
│   ├── RecoveryManager: 書き出し、復旧、クリーンアップ
│   ├── FileWatcherManager: 監視開始/停止、イベント処理
│   ├── atomicWrite: 正常書込み、クラッシュシミュレーション
│   └── focusTrap: フォーカス制御、Escape処理
├── コンポーネントテスト（@testing-library/svelte）
│   ├── FileTree: ツリー表示、展開/折畳み、ARIA属性
│   ├── FileTreeItem: 選択、キーボード操作
│   ├── TabBar: タブ表示、D&D、ARIA属性
│   ├── NewFileDialog: バリデーション、確定/キャンセル
│   ├── RecoveryDialog: 復旧/破棄選択
│   ├── ContextMenu: メニュー表示、キーボード操作
│   └── StatusBar: 自動保存トグル表示
└── カバレッジ目標: ≥ 80%（ビジネスロジック + ユーティリティ）

モック戦略:
- FileSystemAdapter: 全テストでモック（テスト用InMemoryAdapter）
- EditorCore: タブ管理テストでモック
- SettingsManager: セッション復元テストでモック
```

### M-U3-02: FileSystemAdapter抽象化維持
**対応NFR**: NFR-U3-18（FileSystemAdapter抽象化維持）

**設計**:
```typescript
/**
 * FileSystemAdapter拡張（U3で追加するAPI）
 *
 * 既存API（U1で定義済み）:
 *   readFile, writeFile, readDir, mkdir, rename, delete, exists
 *
 * U3追加API:
 */
interface FileSystemAdapterU3Extension {
  /** ファイル監視 */
  watch(path: string, options?: WatchOptions): Promise<UnwatchFn>

  /** ファイルコピー */
  copyFile(src: string, dest: string): Promise<Result<void>>

  /** ディレクトリ削除（再帰対応） */
  removeDir(path: string, options?: { recursive: boolean }): Promise<Result<void>>

  /** ファイル情報取得（サイズ、シンボリックリンク判定） */
  getFileInfo(path: string): Promise<Result<FileInfo>>

  /** ファイル部分読み込み（バイナリチェック用） */
  readFilePartial(path: string, offset: number, length: number): Promise<Result<Uint8Array>>
}

interface FileInfo {
  size: number
  isSymlink: boolean
  lastModified: number
}

/**
 * テスト用InMemoryFileSystemAdapter
 * - メモリ上のMap<string, string>でファイルシステムを模擬
 * - 全APIを実装、FileSystemErrorを適切に返却
 * - watch()はイベントの手動発火メソッドを追加
 */
```

---

## NFRパターン ↔ NFR要件 マッピング

| パターンID | パターン名 | 対応NFR | 対象コンポーネント |
|---|---|---|---|
| P-U3-01 | 遅延ファイルツリー読み込み | NFR-U3-01 | FileTreeLoader, FileTree.svelte |
| P-U3-02 | タブコンテンツキャッシュ | NFR-U3-03 | FileManager (tab mgmt) |
| P-U3-03 | 仮想スクロール | NFR-U3-05 | FileTreeVirtualizer, FileTree.svelte |
| P-U3-04 | セッション遅延復元 | NFR-U3-04 | WorkspaceService |
| P-U3-05 | ファイル監視デバウンス | NFR-U3-06 | FileWatcherManager |
| P-U3-06 | ファイル操作パフォーマンスガイドライン | NFR-U3-02 | FileManager (全CRUD) |
| R-U3-01 | クラッシュリカバリ | NFR-U3-08 | RecoveryManager |
| R-U3-02 | アトミックセッション保存 | NFR-U3-09 | atomicWriteSession() |
| R-U3-03 | 外部変更競合解決 | NFR-U3-10 | FileWatcherManager → FileManager |
| R-U3-04 | ファイルI/Oエラーハンドリング | NFR-U3-07 | handleFileError() |
| S-U3-01 | パストラバーサル多層防御 | NFR-U3-11 | PathValidator |
| S-U3-02 | ファイル名サニタイズ | NFR-U3-12 | FileNameValidator |
| S-U3-03 | 外部ファイルインポート安全性 | NFR-U3-13 | validateImportFile() |
| A-U3-01 | ツリーウィジェット | NFR-U3-14 | FileTree.svelte, FileTreeItem.svelte |
| A-U3-02 | タブウィジェット | NFR-U3-15 | TabBar.svelte, TabItem.svelte |
| A-U3-03 | ダイアログ/メニュー | NFR-U3-16 | NewFileDialog, ContextMenu, confirmDialog |
| M-U3-01 | テスト戦略 | NFR-U3-17 | 全コンポーネント |
| M-U3-02 | FileSystemAdapter抽象化維持 | NFR-U3-18 | FileSystemAdapter拡張 |

### 仮想スクロール + ARIA統合ガイドライン

仮想スクロール（P-U3-03）とツリーウィジェットARIA（A-U3-01）の統合:
- 仮想スクロール発動時、DOMに存在しないノードのARIA情報は失われる
- 対策: ツリーコンテナに `aria-setsize`（全ノード数）と各ノードに `aria-posinset`（位置）を設定
- スクリーンリーダーはこれらの属性でツリー全体のサイズと現在位置を把握可能

```html
<div role="tree" aria-label="ファイルエクスプローラー">
  <!-- 仮想スクロールにより一部ノードのみDOM上に存在 -->
  <div role="treeitem" aria-setsize="500" aria-posinset="42" aria-level="1">
    ...
  </div>
</div>
```
