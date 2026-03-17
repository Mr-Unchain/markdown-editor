# サービスレイヤー定義

## サービス一覧

| ID | サービス | 責務 |
|---|---|---|
| S1 | PublishService | 記事公開のオーケストレーション |
| S2 | WorkspaceService | ワークスペース操作のオーケストレーション |

---

## S1: PublishService

**責務**: 記事の公開・更新プロセス全体のオーケストレーション

プラットフォームへの投稿は複数コンポーネントの連携が必要なため、PublishServiceがフローを統括する。

### オーケストレーションフロー

```
ユーザーが「投稿」を実行
    |
    v
PublishService.publish(platformId, options)
    |
    +---> EditorCore.getContent()        // ドキュメント取得
    |
    +---> ExportService.toPlatformFormat() // プラットフォーム向け変換
    |
    +---> ImageManager.uploadForPlatform() // 画像アップロード
    |         |
    |         +---> PlatformAdapter.uploadImage() // 各画像をアップロード
    |
    +---> PlatformAdapter.publishDraft()  // 記事投稿
    |
    +---> 結果をUIに通知
```

### メソッド定義

```typescript
interface PublishService {
  // 投稿
  publish(platformId: string, options: PublishOptions): Promise<PublishResult>
  update(platformId: string, articleId: string, options: PublishOptions): Promise<PublishResult>

  // エクスポート（API不要のプラットフォーム向け）
  exportToClipboard(format: 'markdown' | 'html'): Promise<void>
  exportToFile(format: 'markdown' | 'html', filename: string): Promise<void>

  // プラットフォーム一覧
  getAvailablePlatforms(): PlatformInfo[]
  getPlatformStatus(platformId: string): PlatformConnectionStatus
}

interface PublishOptions {
  title: string
  tags?: string[]
  category?: string
  publishAs: 'draft' | 'public'
}

interface PlatformInfo {
  id: string
  name: string
  isConnected: boolean
  supportsDirectPublish: boolean
}
```

---

## S2: WorkspaceService

**責務**: ワークスペースの初期化・復元のオーケストレーション

アプリ起動時のワークスペース復元や新規ワークスペース開設を統括する。

### オーケストレーションフロー

```
アプリ起動
    |
    v
WorkspaceService.initialize()
    |
    +---> SettingsManager.get('lastWorkspace')    // 最後のワークスペース取得
    |
    +---> FileManager.openWorkspace(path)          // ワークスペースを開く
    |         |
    |         +---> FileSystemAdapter.readDir()     // ファイルツリー読み込み
    |
    +---> SettingsManager.get('openTabs')           // 前回のタブ状態復元
    |
    +---> FileManager.openFile(tabPath)             // 各タブのファイルを開く
    |
    +---> PluginSystem.initialize()                 // プラグイン初期化
    |
    +---> UIShellに状態を通知
```

### メソッド定義

```typescript
interface WorkspaceService {
  // 初期化
  initialize(): Promise<void>

  // ワークスペース操作
  openWorkspace(): Promise<void>    // ダイアログを表示してフォルダ選択
  closeWorkspace(): Promise<void>   // 未保存チェック付き

  // セッション管理
  saveSession(): Promise<void>      // 現在の状態を保存（タブ、カーソル位置等）
  restoreSession(): Promise<void>   // 前回の状態を復元

  // アプリ終了
  requestClose(): Promise<boolean>  // 未保存チェック、falseなら終了キャンセル
}
```

---

## サービス連携パターン

### 依存注入
サービスはコンストラクタでコンポーネントを受け取り、コンポーネント間の直接依存を避ける。

```typescript
// 例: PublishServiceの生成
const publishService = new PublishService(
  editorCore,
  exportService,
  imageManager,
  platformAdapterRegistry,
  notificationService
)
```

### イベント駆動
コンポーネント間の疎結合な通信にはSvelte Storeのリアクティブ性を活用する。

```typescript
// 例: ファイル保存状態の変更がUIに自動反映
const dirtyFiles = writable<Set<string>>(new Set())

// FileManagerが更新
dirtyFiles.update(files => { files.add(path); return files })

// UIShellのタブコンポーネントが自動反映
$: isDirty = $dirtyFiles.has(currentTab.path)
```
