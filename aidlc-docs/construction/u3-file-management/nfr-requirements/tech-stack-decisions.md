# U3: File Management — Tech Stack Decisions

## 既存Tech Stack（U1/U2から継承）

| カテゴリ | 技術 | 備考 |
|---|---|---|
| フレームワーク | Svelte 5 (runes) | $state/$derived/$props |
| デスクトップ | Tauri 2.x | プラグイン体系 |
| ファイルI/O | @tauri-apps/plugin-fs | FileSystemAdapter経由 |
| セキュア保存 | @tauri-apps/plugin-stronghold | 認証情報 |
| ダイアログ | @tauri-apps/plugin-dialog | ファイル/フォルダ選択 |
| 設定管理 | SettingsManager (U1) | JSON永続化 |
| エディター | Tiptap 3.x | EditorCore (U2) |
| テスト | Vitest + @testing-library/svelte | 既存テスト基盤 |

## U3で追加する技術

### ファイル監視: @tauri-apps/plugin-fs (watch API)

**選定理由**:
- Tauri 2.xのfsプラグインにwatch機能が内蔵済み
- 追加パッケージ不要（既存依存に含まれる）
- OS固有のファイル監視API（Windows: ReadDirectoryChangesW, macOS: FSEvents, Linux: inotify）をRust側で抽象化
- デバウンス制御可能

**使用パターン**:
```typescript
// FileSystemAdapter に追加するAPI
interface FileWatcher {
  watch(path: string, options?: WatchOptions): Promise<UnwatchFn>
}

interface WatchOptions {
  recursive: boolean       // サブディレクトリも監視
  debounceMs: number       // デバウンス間隔（デフォルト: 500ms）
}

type UnwatchFn = () => Promise<void>
```

### 仮想スクロール: 自前実装（軽量）

**選定理由**:
- 小規模ワークスペース（〜100ファイル）がメインターゲット
- 仮想スクロールが発動するのは200+エントリの場合のみ
- ツリー構造（可変高さ、ネスト）の仮想スクロールは汎用ライブラリでは対応しにくい
- 軽量な自前実装で十分（固定高さアイテム前提、展開/折り畳みでリスト再計算）

**実装方針**:
- `FileTreeVirtualizer` ユーティリティクラス
- フラット化された可視ノード配列を管理
- IntersectionObserver or scroll event + requestAnimationFrame
- 表示分 + 上下バッファ（各20ノード）のみDOMレンダリング

**不採用案**:
- `@tanstack/svelte-virtual`: ツリー構造のサポートが限定的
- `svelte-virtual-list`: メンテナンス停滞、Svelte 5未対応の可能性

### D&Dタブ並び替え: HTML5 Drag and Drop API

**選定理由**:
- タブバー内の1次元並び替えはHTML5 D&D APIで十分
- 追加パッケージ不要
- ブラウザネイティブ、Tauriでも動作
- アクセシビリティ: キーボード代替操作も併用（Ctrl+Shift+Left/Right）

**不採用案**:
- `@dnd-kit/core`: 多機能だがタブ並び替えだけには過剰
- `svelte-dnd-action`: Svelte 5対応状況が不明確

### リカバリファイル: 自前実装

**選定理由**:
- 30秒間隔のタイマーで未保存コンテンツをtmpに書き出し
- ファイル形式: プレーンテキスト（Markdown/プレーンテキストそのまま）
- 保存先: `{workspace}/.markdown-editor-recovery/`
- 追加パッケージ不要（FileSystemAdapter使用）

**実装パターン**:
```typescript
class RecoveryManager {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly INTERVAL_MS = 30_000
  private readonly RECOVERY_DIR = '.markdown-editor-recovery'

  start(tabs: Tab[]): void
  stop(): void
  checkRecoveryFiles(workspacePath: string): Promise<RecoveryFile[]>
  applyRecovery(recoveryFile: RecoveryFile): Promise<void>
  cleanupRecoveryFiles(workspacePath: string): Promise<void>
}
```

---

## 追加パッケージ不要の確認

U3では**新規パッケージの追加は不要**。全て既存依存 + 自前実装で対応:

| 機能 | 方式 |
|---|---|
| ファイル監視 | @tauri-apps/plugin-fs (watch) — 既存依存 |
| 仮想スクロール | 自前 FileTreeVirtualizer |
| D&D並び替え | HTML5 Drag and Drop API — ブラウザ内蔵 |
| リカバリファイル | 自前 RecoveryManager — FileSystemAdapter使用 |
| パスバリデーション | 自前 pathValidator — Node.js path互換ロジック |

---

## アーキテクチャ統合

### FileSystemAdapter拡張

U1で定義されたFileSystemAdapterに以下のAPIを追加:

```typescript
// 追加メソッド
interface FileSystemAdapterExtension {
  // ファイル監視
  watch(path: string, options?: WatchOptions): Promise<UnwatchFn>

  // ファイルコピー
  copyFile(src: string, dest: string): Promise<Result<void>>

  // ディレクトリ削除（再帰）
  removeDir(path: string, options?: { recursive: boolean }): Promise<Result<void>>

  // ファイル/ディレクトリ存在確認（U1にない場合）
  exists(path: string): Promise<boolean>
}
```

### Tauriスコープ動的更新

```typescript
// ワークスペース変更時にTauriスコープを更新
async function updateTauriScope(workspacePath: string): Promise<void> {
  // Tauri 2.x の fs scope API を使用
  // ワークスペースフォルダとその配下へのアクセスを許可
}
```

### 起動時間バジェット配分

全体バジェット: 1,000ms（U1 NFR-U1-01）

```
U1: Foundation      — 460ms
  ├── Tauri起動      — 300ms
  ├── FSAdapter init — 10ms
  ├── Settings init  — 50ms
  └── UIShell render — 100ms

残り540msをU2〜U4で分配:
  U2: Editor init    — 200ms（NFR-U2-02）
  U3: File Management — 200ms
    ├── Session読込    — 50ms
    ├── Workspace open — 100ms（ファイルツリー構築含む）
    └── Tab復元        — 50ms（アクティブタブ1つのみ、他は遅延）
  U4: Platform       — 140ms（残り）
```

**注**: U2/U3/U4の初期化は一部並行実行可能。上記は最悪ケース（直列実行）のバジェット。

**最適化戦略**:
- アクティブタブのみ起動時に読み込み（≤ 200ms）、他タブは初回切替時に遅延読み込み
- ファイルツリーはルート直下のみ初回読み込み（遅延展開）
- ファイル監視は起動完了後に非同期で開始
