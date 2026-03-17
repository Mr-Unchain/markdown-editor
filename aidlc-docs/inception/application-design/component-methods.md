# コンポーネントメソッド定義

## C1: EditorCore

```typescript
interface EditorCore {
  // ライフサイクル
  initialize(container: HTMLElement, options?: EditorOptions): void
  destroy(): void

  // ドキュメント操作
  getContent(): ProseMirrorDoc
  setContent(doc: ProseMirrorDoc): void
  getMarkdown(): string
  getHTML(): string
  isEmpty(): boolean

  // エクステンション
  registerExtension(extension: TiptapExtension): void
  unregisterExtension(name: string): void

  // コマンド
  executeCommand(command: EditorCommand): boolean

  // イベント
  onUpdate(callback: (doc: ProseMirrorDoc) => void): Unsubscribe
  onSelectionChange(callback: (selection: Selection) => void): Unsubscribe

  // Undo/Redo
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
}
```

---

## C2: FileManager

```typescript
interface FileManager {
  // ワークスペース
  openWorkspace(path: string): Promise<WorkspaceTree>
  closeWorkspace(): void
  getWorkspaceTree(): WorkspaceTree | null
  getRecentWorkspaces(): string[]

  // ファイル操作
  createFile(parentPath: string, name: string): Promise<FileEntry>
  openFile(path: string): Promise<FileContent>
  saveFile(path: string, content: string): Promise<void>
  renameFile(oldPath: string, newPath: string): Promise<void>
  deleteFile(path: string): Promise<void>

  // タブ管理
  getOpenTabs(): TabInfo[]
  getActiveTab(): TabInfo | null
  setActiveTab(path: string): void
  closeTab(path: string): Promise<boolean>  // false if unsaved and user cancels

  // 変更追跡
  hasUnsavedChanges(path: string): boolean
  markDirty(path: string): void
  markClean(path: string): void
}
```

---

## C3: PluginSystem

```typescript
interface PluginSystem {
  // 初期化
  initialize(settingsManager: SettingsManager): Promise<void>

  // プラグイン管理
  getPluginList(): PluginManifest[]
  getEnabledPlugins(): PluginManifest[]
  enablePlugin(pluginId: string): Promise<void>
  disablePlugin(pluginId: string): Promise<void>
  isEnabled(pluginId: string): boolean

  // プラグイン読み込み
  loadPlugin(pluginId: string): Promise<PluginInstance>
  unloadPlugin(pluginId: string): void

  // EditorCore連携
  getEditorExtensions(): TiptapExtension[]

  // ExportService連携
  getExportTransformers(): ExportTransformer[]
}

interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  type: 'editor-extension' | 'platform-syntax' | 'export-transformer'
  entryPoint: string  // lazy load path
}
```

---

## C4: PlatformAdapter

```typescript
interface PlatformAdapter {
  // 共通インターフェース（各プラットフォームが実装）
  readonly platformId: string
  readonly platformName: string

  // 認証
  authenticate(credentials: PlatformCredentials): Promise<boolean>
  isAuthenticated(): boolean
  testConnection(): Promise<ConnectionTestResult>

  // 記事投稿
  publishDraft(article: ArticlePayload): Promise<PublishResult>
  publishArticle(article: ArticlePayload): Promise<PublishResult>
  updateArticle(id: string, article: ArticlePayload): Promise<PublishResult>

  // 画像アップロード
  uploadImage(image: ImageData): Promise<ImageUploadResult>

  // プラットフォーム固有の機能（オプショナル）
  getCategories?(): Promise<Category[]>
  getTags?(): Promise<Tag[]>
}

interface ArticlePayload {
  title: string
  body: string        // Markdown or HTML (platform dependent)
  bodyFormat: 'markdown' | 'html'
  tags?: string[]
  category?: string
  images: LocalImageRef[]  // ローカル画像参照（アップロード対象）
}
```

---

## C5: ImageManager

```typescript
interface ImageManager {
  // 画像挿入
  handleDrop(event: DragEvent): Promise<ImageInsertResult>
  handlePaste(event: ClipboardEvent): Promise<ImageInsertResult>
  insertFromFile(file: File): Promise<ImageInsertResult>

  // ローカル保存
  saveToWorkspace(imageData: Blob, filename: string): Promise<string>  // returns local path

  // プラットフォームアップロード
  uploadForPlatform(
    localPaths: string[],
    adapter: PlatformAdapter
  ): Promise<ImageUploadResult[]>

  // 進捗
  onUploadProgress(callback: (progress: UploadProgress) => void): Unsubscribe
}
```

---

## C6: ExportService

```typescript
interface ExportService {
  // 変換
  toMarkdown(doc: ProseMirrorDoc): string
  toHTML(doc: ProseMirrorDoc): string
  toPlatformFormat(doc: ProseMirrorDoc, platformId: string): string

  // エクスポート操作
  copyToClipboard(content: string, format: 'text' | 'html'): Promise<void>
  downloadAsFile(content: string, filename: string): Promise<void>

  // プラグイン拡張
  registerTransformer(transformer: ExportTransformer): void
}

interface ExportTransformer {
  platformId: string
  transform(doc: ProseMirrorDoc): string
}
```

---

## C7: SettingsManager

```typescript
interface SettingsManager {
  // 設定読み書き
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): Promise<void>
  getAll(): AppSettings

  // プラットフォーム認証情報
  getPlatformCredentials(platformId: string): PlatformCredentials | undefined
  setPlatformCredentials(platformId: string, credentials: PlatformCredentials): Promise<void>
  removePlatformCredentials(platformId: string): Promise<void>

  // プラグイン設定
  getPluginConfig(): PluginConfig
  setPluginEnabled(pluginId: string, enabled: boolean): Promise<void>

  // イベント
  onChange(callback: (key: string, value: unknown) => void): Unsubscribe
}
```

---

## C8: UIShell

```typescript
// UIShellはSvelteコンポーネントとして実装
// メソッドではなくコンポーネント構成を定義

interface UIShellLayout {
  sidebar: {
    fileTree: SvelteComponent    // FileManagerと連携
    settings: SvelteComponent    // SettingsManagerと連携
  }
  tabBar: SvelteComponent        // FileManagerのタブ情報と連携
  toolbar: SvelteComponent       // EditorCoreのコマンドと連携
  editor: SvelteComponent        // EditorCoreをマウント
  statusBar: SvelteComponent     // 文字数、保存状態等
  commandPalette: SvelteComponent // スラッシュコマンド
  dialogs: {
    publishDialog: SvelteComponent  // 投稿設定
    settingsDialog: SvelteComponent // アプリ設定
    confirmDialog: SvelteComponent  // 確認ダイアログ
  }
}
```

---

## C9: FileSystemAdapter

```typescript
interface FileSystemAdapter {
  // ファイル操作
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  readBinaryFile(path: string): Promise<Uint8Array>
  writeBinaryFile(path: string, data: Uint8Array): Promise<void>

  // ディレクトリ操作
  readDir(path: string): Promise<DirEntry[]>
  mkdir(path: string): Promise<void>
  exists(path: string): Promise<boolean>

  // ファイル管理
  rename(oldPath: string, newPath: string): Promise<void>
  remove(path: string): Promise<void>

  // ダイアログ
  openFolderDialog(): Promise<string | null>
  openFileDialog(filters?: FileFilter[]): Promise<string | null>
  saveFileDialog(defaultName?: string): Promise<string | null>
}

// 実装クラス
// TauriFileSystemAdapter implements FileSystemAdapter  (@tauri-apps/plugin-fs)
// WebFileSystemAdapter implements FileSystemAdapter     (File System Access API)
```

---

## 共通型定義

```typescript
type Unsubscribe = () => void

interface WorkspaceTree {
  root: string
  entries: DirEntry[]
}

interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: DirEntry[]
}

interface FileContent {
  path: string
  content: string
  lastModified: number
}

interface TabInfo {
  path: string
  name: string
  isDirty: boolean
  isActive: boolean
}

interface ImageInsertResult {
  success: boolean
  localPath?: string
  error?: string
}

interface ImageUploadResult {
  localPath: string
  remoteUrl: string
  success: boolean
  error?: string
}

interface UploadProgress {
  total: number
  completed: number
  currentFile: string
}

interface PublishResult {
  success: boolean
  articleId?: string
  articleUrl?: string
  error?: string
}

interface ConnectionTestResult {
  success: boolean
  message: string
}
```
