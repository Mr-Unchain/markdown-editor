# Unit of Work 依存関係

## 依存関係マトリックス

依存方向: 行 → 列（行が列に依存する）

| | U1 Foundation | U2 Core Editor | U3 File Mgmt | U4 Platform |
|---|---|---|---|---|
| **U1 Foundation** | - | | | |
| **U2 Core Editor** | **X** | - | | |
| **U3 File Management** | **X** | **X** | - | |
| **U4 Platform Integration** | **X** | **X** | **X** | - |

## 依存関係の詳細

### U2 → U1 (Foundation)
- UIShell骨格（レイアウトコンテナ）にエディターをマウント
- SettingsManagerからプラグイン設定を読み込み

### U3 → U1 (Foundation)
- FileSystemAdapterでファイルI/O操作
- UIShell骨格にサイドバー・タブを配置
- SettingsManagerでセッション情報を保存/復元

### U3 → U2 (Core Editor)
- FileManagerがEditorCoreからコンテンツ取得（保存時）
- FileManagerがEditorCoreにコンテンツ設定（ファイル開く時）

### U4 → U1 (Foundation)
- FileSystemAdapterで画像ファイルの読み書き
- SettingsManagerで認証情報の保存/読み込み
- UIShell骨格に投稿ダイアログ・設定画面を配置

### U4 → U2 (Core Editor)
- PublishServiceがEditorCoreからドキュメント取得
- ImageManagerがEditorCoreに画像ノードを挿入

### U4 → U3 (File Management)
- ImageManagerがワークスペースフォルダに画像を保存
- PublishServiceが現在のファイル情報を参照

## 開発シーケンス

```
U1: Foundation
    |
    | UIShell骨格, FileSystemAdapter, SettingsManager
    v
U2: Core Editor
    |
    | EditorCore(Tiptap), PluginSystem基盤
    v
U3: File Management
    |
    | FileManager, WorkspaceService, タブ管理
    v
U4: Platform Integration
    |
    | ZennAdapter, ImageManager, ExportService, PublishService
    v
  MVP Complete
```

## クリティカルパス

全ユニットが順次依存のため、クリティカルパスは U1 → U2 → U3 → U4 の全ステップ。

並行開発の可能性:
- U2とU3は部分的に並行可能（EditorCoreとFileManagerの結合ポイントはインターフェースで定義済み）
- ただし、推奨は順次開発（結合テストの容易さ）
