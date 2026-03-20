# U1: Foundation - 論理コンポーネント配置図

## コンポーネント構成

### レイヤー構成と配置

```
+================================================================+
|                     Presentation Layer                          |
|                                                                 |
|  +------------------+  +------------------+  +--------------+   |
|  | UIShell          |  | Sidebar          |  | StatusBar    |   |
|  | (+layout.svelte) |  | (slot: U3で実装) |  | (slot: U2-4) |   |
|  +------------------+  +------------------+  +--------------+   |
|  +------------------+  +-------------------------------------+  |
|  | Toolbar          |  | EditorArea (slot: U2で実装)          |  |
|  | (slot: U2で実装) |  |                                     |  |
|  +------------------+  +-------------------------------------+  |
|  +------------------+  +-------------------------------------+  |
|  | NotificationToast|  | ConfirmDialog                       |  |
|  +------------------+  +-------------------------------------+  |
+================================================================+
         |                              |
         | $store 購読                  | イベント発行
         v                              v
+================================================================+
|                       Store Layer                               |
|                                                                 |
|  +------------------+  +------------------+  +--------------+   |
|  | layoutState      |  | appSettings      |  | notifications|   |
|  | (writable)       |  | (writable)       |  | (writable)   |   |
|  +------------------+  +------------------+  +--------------+   |
|  +------------------+  +-------------------------------------+  |
|  | currentFile      |  | saveStatus                          |  |
|  | (writable)       |  | (writable)                          |  |
|  +------------------+  +-------------------------------------+  |
+================================================================+
         ^                              ^
         | store.update()               | store.set()
         |                              |
+================================================================+
|                     Service Layer                               |
|                                                                 |
|  +-------------------------------------------------------------+|
|  | SettingsManager                                              ||
|  | - initialize(): Promise<void>                                ||
|  | - get<T>(key): T                                             ||
|  | - set<T>(key, value): Promise<void>                          ||
|  | - flush(): Promise<void>      [Debounce: 500ms]              ||
|  +-------------------------------------------------------------+|
+================================================================+
         |                              |
         | read/write                   | get/set/remove
         v                              v
+================================================================+
|                  Infrastructure Layer                           |
|                                                                 |
|  +----------------------------+  +----------------------------+ |
|  | FileSystemAdapter (IF)     |  | SecureStorage (IF)         | |
|  |                            |  |                            | |
|  | +------------------------+ |  | +------------------------+ | |
|  | | TauriFileSystemAdapter | |  | | TauriSecureStorage     | | |
|  | | - @tauri-apps/plugin-fs| |  | | - plugin-stronghold    | | |
|  | | - @tauri-apps/plugin-  | |  | +------------------------+ | |
|  | |   dialog               | |  | +------------------------+ | |
|  | +------------------------+ |  | | WebSecureStorage       | | |
|  | | WebFileSystemAdapter   | |  | | - localStorage +       | | |
|  | | - File System Access   | |  | |   base64               | | |
|  | |   API                  | |  | +------------------------+ | |
|  | +------------------------+ |  |                            | |
|  +----------------------------+  +----------------------------+ |
+================================================================+
```

## コンポーネント間データフロー

### 起動シーケンス

```
[App Start]
    |
    v
(1) createFileSystemAdapter()           < 10ms
    環境検出 → Adapter インスタンス生成
    |
    v
(2) SettingsManager.initialize()        < 50ms
    FileSystemAdapter経由で設定読み込み
    → appSettings Store 更新
    |
    v
(3) UIShell レンダリング               < 100ms
    $layoutState, $appSettings を購読
    骨格UI描画（スロットは空）
    |
    v
(4) [起動完了] ユーザー操作可能        合計 < 460ms
    |
    v
(5) [バックグラウンド] SecureStorage 遅延初期化
    → 初回の認証情報アクセス時のみ
```

### 設定変更フロー

```
[ユーザー操作: テーマ変更]
    |
    v
UIコンポーネント → SettingsManager.set('editor.theme', 'dark')
    |
    +--> (即時) appSettings.update() → UI自動再レンダリング
    |
    +--> (500ms後) flush() → FileSystemAdapter.writeFile()
```

### エラー通知フロー

```
[FileSystemAdapter でI/Oエラー発生]
    |
    v
Result<T> = { ok: false, error: FileSystemError }
    |
    v
呼び出し元が error を受け取る
    |
    v
notify('error', error.message)
    → notifications Store に追加
    → NotificationToast が自動表示
    → 5000ms後に自動消去
```

## NFRパターンとコンポーネントの対応表

| パターン | 適用コンポーネント | NFR要件 |
|---|---|---|
| P1: 遅延初期化 | FileSystemAdapter, SecureStorage | NFR-U1-01 |
| P2: デバウンス書き込み | SettingsManager | NFR-U1-02 |
| R1: セーフラッパー | FileSystemAdapter 全操作 | NFR-U1-05 |
| R2: デフォルトフォールバック | SettingsManager | NFR-U1-04 |
| R3: グレースフルデグラデーション | Web版全コンポーネント | NFR-U1-06 |
| S1: アダプターパターン | FileSystemAdapter, SecureStorage | NFR-U1-01 |
| S2: ストアパターン | 全Store, SettingsManager | NFR-U1-02 |

## ファイル配置計画

```
markdown-editor/src/lib/
├── infrastructure/
│   ├── filesystem/
│   │   ├── types.ts              # FileSystemAdapter IF, Result<T>, FileSystemError
│   │   ├── tauri-fs-adapter.ts   # TauriFileSystemAdapter
│   │   ├── web-fs-adapter.ts     # WebFileSystemAdapter
│   │   ├── factory.ts            # createFileSystemAdapter()
│   │   └── safe-call.ts          # safeCall<T>() ユーティリティ
│   └── secure-storage/
│       ├── types.ts              # SecureStorage IF
│       ├── tauri-secure-storage.ts
│       └── web-secure-storage.ts
├── core/
│   └── settings/
│       ├── settings-manager.ts   # SettingsManager（デバウンス書き込み含む）
│       ├── defaults.ts           # DEFAULT_SETTINGS
│       └── merge.ts              # mergeWithDefaults()
├── stores/
│   ├── layout.ts                 # layoutState Store
│   ├── settings.ts               # appSettings Store
│   ├── notifications.ts          # notifications Store + notify()
│   ├── current-file.ts           # currentFile Store
│   └── save-status.ts            # saveStatus Store
├── types/
│   ├── settings.ts               # AppSettings, EditorSettings, etc.
│   ├── layout.ts                 # LayoutState, SidebarPanel
│   └── notification.ts           # Notification type
└── components/
    └── shell/
        ├── UIShell.svelte        # メインレイアウト
        ├── Toolbar.svelte        # ツールバー骨格
        ├── Sidebar.svelte        # サイドバー骨格（トグル）
        ├── StatusBar.svelte      # ステータスバー
        ├── NotificationToast.svelte
        └── ConfirmDialog.svelte
