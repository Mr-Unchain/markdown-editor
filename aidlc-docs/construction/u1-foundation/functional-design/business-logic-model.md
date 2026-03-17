# U1: Foundation - ビジネスロジックモデル

## FileSystemAdapter: 環境検出ロジック

### 検出フロー

```
アプリ起動
    |
    v
window.__TAURI_INTERNALS__ が存在するか？
    |
    +-- Yes --> TauriFileSystemAdapter を使用
    |
    +-- No  --> 'showOpenFilePicker' in window を確認
                   |
                   +-- Yes --> WebFileSystemAdapter を使用
                   |
                   +-- No  --> エラー表示（非対応ブラウザ）
```

### アダプター生成

```typescript
function createFileSystemAdapter(): FileSystemAdapter {
  if (isTauri()) {
    return new TauriFileSystemAdapter()
  }
  if (isFileSystemAccessSupported()) {
    return new WebFileSystemAdapter()
  }
  throw new Error('お使いの環境はサポートされていません。')
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}
```

### TauriFileSystemAdapter 実装概要

| メソッド | Tauri API |
|---|---|
| readFile | `@tauri-apps/plugin-fs` > readTextFile |
| writeFile | `@tauri-apps/plugin-fs` > writeTextFile |
| readBinaryFile | `@tauri-apps/plugin-fs` > readFile |
| writeBinaryFile | `@tauri-apps/plugin-fs` > writeFile |
| readDir | `@tauri-apps/plugin-fs` > readDir |
| mkdir | `@tauri-apps/plugin-fs` > mkdir |
| exists | `@tauri-apps/plugin-fs` > exists |
| rename | `@tauri-apps/plugin-fs` > rename |
| remove | `@tauri-apps/plugin-fs` > remove |
| openFolderDialog | `@tauri-apps/plugin-dialog` > open({ directory: true }) |
| openFileDialog | `@tauri-apps/plugin-dialog` > open({ filters }) |
| saveFileDialog | `@tauri-apps/plugin-dialog` > save({ defaultPath }) |

### WebFileSystemAdapter 実装概要

| メソッド | Web API |
|---|---|
| readFile | FileSystemFileHandle.getFile() > text() |
| writeFile | FileSystemFileHandle.createWritable() > write() |
| readBinaryFile | FileSystemFileHandle.getFile() > arrayBuffer() |
| writeBinaryFile | FileSystemFileHandle.createWritable() > write() |
| readDir | FileSystemDirectoryHandle.values() でイテレート |
| mkdir | FileSystemDirectoryHandle.getDirectoryHandle(name, { create: true }) |
| exists | try/catch で getFileHandle / getDirectoryHandle |
| rename | Web FS Access API では直接サポートなし → コピー＋削除で実現 |
| remove | FileSystemDirectoryHandle.removeEntry() |
| openFolderDialog | window.showDirectoryPicker() |
| openFileDialog | window.showOpenFilePicker({ types }) |
| saveFileDialog | window.showSaveFilePicker({ suggestedName }) |

**Web版の制約**:
- File System Access API は Chromium系ブラウザのみサポート
- ファイルハンドルはセッション間で永続化されない（毎回フォルダを再選択する必要あり）
- `rename` は直接サポートされていないため、コピー＋削除で代替

---

## SettingsManager: 設定の読み込み・保存

### 設定ファイルパス

| 環境 | パス |
|---|---|
| Tauri | `{appDataDir}/settings.json` |
| Web | `localStorage` キー `markdown-editor-settings` |

### 初期化フロー

```
SettingsManager.initialize()
    |
    v
設定ファイル/ストレージが存在するか？
    |
    +-- Yes --> 読み込み → スキーマバリデーション → マージ（デフォルトで欠損補完）
    |
    +-- No  --> デフォルト設定を作成 → 保存
```

### デフォルト設定

```typescript
const DEFAULT_SETTINGS: AppSettings = {
  lastWorkspacePath: null,
  recentWorkspaces: [],
  editor: {
    fontSize: 16,
    theme: 'light',
    editorWidth: 720,
  },
  plugins: {
    enabled: {},
  },
  platforms: {
    connections: [
      { platformId: 'zenn', displayName: 'Zenn', isConfigured: false },
      { platformId: 'note', displayName: 'note', isConfigured: false },
      { platformId: 'microcms', displayName: 'microCMS', isConfigured: false },
      { platformId: 'contentful', displayName: 'Contentful', isConfigured: false },
    ],
  },
}
```

### 設定変更の永続化

```
SettingsManager.set(key, value)
    |
    v
Svelte Store を更新 (即時UI反映)
    |
    v
debounce(500ms) でファイルに書き込み (I/O最適化)
```

---

## SecureStorage: 認証情報の保存

### Tauri版 (TauriSecureStorage)

```
tauri-plugin-stronghold を使用
    |
    +-- Strongholdファイル: {appDataDir}/vault.stronghold
    +-- キー形式: "platform:{platformId}" → JSON文字列化したCredentials
    +-- Strongholdはアプリ起動時にパスフレーズなしで自動アンロック
        （Tauri内部で管理されるため安全）
```

### Web版 (WebSecureStorage)

```
localStorage にフォールバック
    |
    +-- キー形式: "markdown-editor-secure:{key}"
    +-- 値はプレーンテキスト（base64エンコードのみ、暗号化なし）
    +-- 初回アクセス時に警告メッセージを表示:
        「Web版ではAPIキーがブラウザに保存されます。
         共有端末での利用にはご注意ください。」
```

---

## UIShell: レイアウトロジック

### Typora風レイアウト構成

```
+-----------------------------------------------------------+
| [Toolbar]  タイトル表示 | 書式ボタン | 投稿ボタン          |
+-----------------------------------------------------------+
|          |                                                 |
| Sidebar  |              Editor Area                        |
| (toggle) |              (中央配置、最大幅制限)               |
|          |                                                 |
| ファイル  |                                                 |
| ツリー    |                                                 |
|          |                                                 |
+-----------------------------------------------------------+
| [StatusBar]  文字数 | 行数 | 保存状態 | 接続状態            |
+-----------------------------------------------------------+
```

### サイドバー トグルロジック

```
ユーザーがトグルボタン or Ctrl/Cmd+\ を押す
    |
    v
sidebarVisible を反転
    |
    +-- true  --> サイドバーをスライドイン表示（アニメーション 200ms）
    |             エディターエリアが縮小
    |
    +-- false --> サイドバーをスライドアウト（アニメーション 200ms）
                  エディターエリアが全幅に拡大
```

### エディター中央配置

```
Editor Area のスタイル:
    - max-width: {editorWidth}px （設定値、デフォルト720px）
    - margin: 0 auto （中央配置）
    - padding: 2rem
    - サイドバー表示時も中央配置を維持
```
