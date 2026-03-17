# U1: Foundation - ドメインエンティティ

## FileSystemAdapter 関連

```typescript
/** ディレクトリエントリ */
interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  children?: DirEntry[]  // isDirectory=true の場合のみ
}

/** ファイル内容 */
interface FileContent {
  path: string
  content: string
  lastModified: number  // Unix timestamp (ms)
}

/** ファイルフィルター（ダイアログ用） */
interface FileFilter {
  name: string        // 例: "Markdown Files"
  extensions: string[] // 例: ["md", "markdown"]
}

/** ファイル操作エラー */
interface FileSystemError {
  code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'ALREADY_EXISTS' | 'IO_ERROR' | 'NOT_SUPPORTED'
  message: string
  path?: string
}
```

## Settings 関連

```typescript
/** アプリケーション設定 */
interface AppSettings {
  // ワークスペース
  lastWorkspacePath: string | null
  recentWorkspaces: string[]          // 最大10件

  // エディター表示
  editor: EditorSettings

  // プラグイン
  plugins: PluginConfig

  // プラットフォーム接続
  platforms: PlatformConnectionConfig
}

/** エディター表示設定 */
interface EditorSettings {
  fontSize: number         // デフォルト: 16
  theme: 'light' | 'dark'  // デフォルト: 'light'
  editorWidth: number      // エディター幅（px）、デフォルト: 720
}

/** プラグイン設定 */
interface PluginConfig {
  enabled: Record<string, boolean>  // { pluginId: true/false }
}

/** プラットフォーム接続設定（認証情報の参照のみ、実際のキーはSecureStorageに保存） */
interface PlatformConnectionConfig {
  connections: PlatformConnection[]
}

interface PlatformConnection {
  platformId: string       // 'zenn' | 'note' | 'microcms' | 'contentful'
  displayName: string
  isConfigured: boolean    // 認証情報が設定済みか
}

/** プラットフォーム認証情報（SecureStorageに保存） */
type PlatformCredentials =
  | ZennCredentials
  | NoteCredentials
  | MicroCMSCredentials
  | ContentfulCredentials

interface ZennCredentials {
  type: 'zenn'
  githubToken: string     // GitHub Personal Access Token
  repository: string      // Zenn記事リポジトリ名
}

interface NoteCredentials {
  type: 'note'
  accessToken: string
}

interface MicroCMSCredentials {
  type: 'microcms'
  serviceId: string
  apiKey: string
}

interface ContentfulCredentials {
  type: 'contentful'
  spaceId: string
  accessToken: string
  environmentId: string   // デフォルト: 'master'
}
```

## UIShell 関連

```typescript
/** レイアウト状態 */
interface LayoutState {
  sidebarVisible: boolean     // サイドバー表示/非表示（デフォルト: false — Typora風）
  sidebarWidth: number        // サイドバー幅（px）、デフォルト: 260
  sidebarPanel: SidebarPanel  // 現在表示中のサイドバーパネル
}

/** サイドバーパネル種別 */
type SidebarPanel = 'file-tree' | 'settings'

/** 通知メッセージ */
interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration: number  // ms、0 = 手動で閉じるまで表示
}
```

## Secure Storage 関連

```typescript
/** セキュアストレージインターフェース */
interface SecureStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  has(key: string): Promise<boolean>
}

// 実装:
// TauriSecureStorage — tauri-plugin-stronghold を使用
// WebSecureStorage — localStorage にフォールバック（セキュリティ注意事項を表示）
```
