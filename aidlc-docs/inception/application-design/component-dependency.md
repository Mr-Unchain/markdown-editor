# コンポーネント依存関係

## 依存関係マトリックス

依存方向: 行 → 列（行が列に依存する）

| | C1 Editor | C2 File | C3 Plugin | C4 Platform | C5 Image | C6 Export | C7 Settings | C8 UI | C9 FS |
|---|---|---|---|---|---|---|---|---|---|
| **C1 EditorCore** | - | | | | | | | | |
| **C2 FileManager** | | - | | | | | | | **X** |
| **C3 PluginSystem** | **X** | | - | | | **X** | **X** | | |
| **C4 PlatformAdapter** | | | | - | | | **X** | | |
| **C5 ImageManager** | | | | **X** | - | | | | **X** |
| **C6 ExportService** | | | | | | - | | | |
| **C7 SettingsManager** | | | | | | | - | | **X** |
| **C8 UIShell** | **X** | **X** | | | | | **X** | - | |
| **C9 FileSystemAdapter** | | | | | | | | | - |
| **S1 PublishService** | **X** | | | **X** | **X** | **X** | | | |
| **S2 WorkspaceService** | | **X** | **X** | | | | **X** | | |

## レイヤー構成

```
+-----------------------------------------------------------+
|                    Presentation Layer                      |
|  +-----------------------------------------------------+  |
|  |  C8: UIShell                                        |  |
|  |  (Sidebar, TabBar, Toolbar, StatusBar, Dialogs)     |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
         |              |              |
         v              v              v
+-----------------------------------------------------------+
|                    Service Layer                           |
|  +------------------------+ +---------------------------+ |
|  | S1: PublishService      | | S2: WorkspaceService     | |
|  | (投稿オーケストレーション) | | (起動・セッション管理)    | |
|  +------------------------+ +---------------------------+ |
+-----------------------------------------------------------+
         |         |         |         |
         v         v         v         v
+-----------------------------------------------------------+
|                      Core Layer                           |
|  +----------+ +----------+ +----------+ +--------------+  |
|  | C1:      | | C2:      | | C3:      | | C5:          |  |
|  | Editor   | | File     | | Plugin   | | Image        |  |
|  | Core     | | Manager  | | System   | | Manager      |  |
|  +----------+ +----------+ +----------+ +--------------+  |
+-----------------------------------------------------------+
         |         |         |         |
         v         v         v         v
+-----------------------------------------------------------+
|                  Integration Layer                         |
|  +------------------------+ +---------------------------+ |
|  | C4: PlatformAdapter    | | C6: ExportService        | |
|  | (Zenn, note, microCMS) | | (MD, HTML, Platform)     | |
|  +------------------------+ +---------------------------+ |
+-----------------------------------------------------------+
         |              |              |
         v              v              v
+-----------------------------------------------------------+
|                 Infrastructure Layer                       |
|  +---------------------------+ +------------------------+ |
|  | C7: SettingsManager       | | C9: FileSystemAdapter  | |
|  | (設定永続化)               | | (Tauri/Web抽象化)      | |
|  +---------------------------+ +------------------------+ |
+-----------------------------------------------------------+
```

## データフロー

### フロー1: 記事執筆フロー

```
User Input --> C8:UIShell --> C1:EditorCore --> Svelte Store (doc state)
                                                      |
                                               C8:UIShell (リアルタイム表示更新)
```

### フロー2: ファイル保存フロー

```
User (Ctrl+S) --> C8:UIShell --> C2:FileManager --> C1:EditorCore.getMarkdown()
                                      |
                                      v
                                C9:FileSystemAdapter.writeFile()
                                      |
                                      v
                                Svelte Store (dirty state cleared)
```

### フロー3: 記事投稿フロー

```
User (投稿ボタン) --> C8:UIShell --> S1:PublishService
                                          |
                        +-----------------+------------------+
                        |                 |                  |
                        v                 v                  v
                  C1:EditorCore    C5:ImageManager    C6:ExportService
                  .getContent()   .uploadForPlatform()  .toPlatformFormat()
                                       |
                                       v
                                 C4:PlatformAdapter
                                 .uploadImage()
                                       |
                                       v
                                 C4:PlatformAdapter
                                 .publishDraft()
                                       |
                                       v
                                 C8:UIShell (結果通知)
```

### フロー4: アプリ起動フロー

```
App Start --> S2:WorkspaceService.initialize()
                    |
                    +---> C7:SettingsManager (前回状態読み込み)
                    |
                    +---> C2:FileManager.openWorkspace()
                    |          |
                    |          +---> C9:FileSystemAdapter.readDir()
                    |
                    +---> C3:PluginSystem.initialize()
                    |          |
                    |          +---> C1:EditorCore.registerExtension() (有効なプラグイン)
                    |
                    +---> C2:FileManager.openFile() (前回のタブ復元)
                    |
                    +---> C8:UIShell (表示更新)
```

## 通信パターン

| パターン | 使用箇所 | 説明 |
|---|---|---|
| **直接呼び出し** | Service → Component | サービスがコンポーネントメソッドを直接呼び出し |
| **Svelte Store** | Component → UI | リアクティブな状態変更の自動反映 |
| **コールバック** | Component → Component | イベントリスナー登録（onUpdate, onChange等） |
| **アダプターパターン** | C9, C4 | 環境/プラットフォーム差異の抽象化 |
