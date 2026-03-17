# コンポーネント定義

## コンポーネント一覧

| ID | コンポーネント | レイヤー | 責務 |
|---|---|---|---|
| C1 | EditorCore | Core | WYSIWYGエディターエンジン（Tiptap） |
| C2 | FileManager | Core | ワークスペース・ファイルのCRUD操作 |
| C3 | PluginSystem | Core | プラグインの登録・ライフサイクル管理 |
| C4 | PlatformAdapter | Integration | プラットフォーム連携の抽象レイヤー |
| C5 | ImageManager | Core | 画像の挿入・保存・アップロード |
| C6 | ExportService | Integration | エクスポート・フォーマット変換 |
| C7 | SettingsManager | Infrastructure | 設定の読み書き・永続化 |
| C8 | UIShell | Presentation | アプリケーションシェル（サイドバー、タブ、ツールバー） |
| C9 | FileSystemAdapter | Infrastructure | ファイルシステムの環境別抽象化 |

---

## C1: EditorCore

**責務**: WYSIWYGマークダウン編集の中核エンジン

- Tiptapエディターインスタンスの初期化と管理
- ドキュメント（ProseMirror Document）の状態管理
- 組み込みエクステンション（書式、リスト、テーブル、コードブロック等）の提供
- スラッシュコマンドの提供
- キーボードショートカットの処理
- Undo/Redo履歴管理
- プラグインからの拡張エクステンション登録受付

**技術選定**: Tiptap v2 + ProseMirror

---

## C2: FileManager

**責務**: ワークスペースとファイルのライフサイクル管理

- ワークスペース（フォルダ）の開閉
- ファイルツリーの構築と表示データの提供
- ファイルのCRUD（作成、読み込み、保存、名前変更、削除）
- 開いているタブの管理（複数タブ）
- 未保存変更の追跡
- 最近開いたワークスペースの記録

**依存**: FileSystemAdapter（ファイルI/O操作を委譲）

---

## C3: PluginSystem

**責務**: プラグインの登録、有効/無効切り替え、ライフサイクル管理

- プラグインマニフェスト（JSON）の読み込みと解析
- プラグインの有効/無効状態管理（設定ファイルベース）
- 有効なプラグインの遅延読み込み（lazy loading）
- EditorCoreへのTiptapエクステンション登録
- ExportServiceへのフォーマット変換ルール登録
- プラグインのエラーハンドリング（プラグイン障害がコアに影響しない）

**プラグイン構成**: アプリに同梱、JSON設定で有効/無効を切り替え

---

## C4: PlatformAdapter

**責務**: 各プラットフォームとの連携を抽象化

- プラットフォームアダプターインターフェースの定義
- 具体的なアダプター実装:
  - ZennAdapter: Zenn APIとの連携（GitHub経由）
  - NoteAdapter: note APIとの連携（Post-MVP）
  - MicroCMSAdapter: microCMS APIとの連携（Post-MVP）
  - ContentfulAdapter: Contentful APIとの連携（Post-MVP）
- 認証情報の管理（SettingsManagerへ委譲）
- API呼び出しのエラーハンドリングとリトライ

---

## C5: ImageManager

**責務**: 画像の挿入、ローカル保存、プラットフォームアップロード

- ドラッグ&ドロップ・ペーストによる画像受け取り
- ワークスペース内への画像ファイル保存
- プラットフォーム投稿時の画像アップロード（PlatformAdapterへ委譲）
- アップロード後の画像URL置換
- アップロード進捗の通知

---

## C6: ExportService

**責務**: ドキュメントのフォーマット変換とエクスポート

- ProseMirror Document → Markdown変換
- ProseMirror Document → HTML変換
- プラットフォーム固有フォーマットへの変換（プラグインから登録されたルール使用）
- クリップボードへのコピー
- ファイルへのダウンロード

---

## C7: SettingsManager

**責務**: アプリケーション設定の読み書きと永続化

- 設定ファイル（JSON）の読み書き
- プラットフォーム認証情報のセキュアな保存
- プラグイン有効/無効設定の管理
- エディター表示設定（フォントサイズ、テーマ等）
- 設定変更イベントの通知

**永続化**: FileSystemAdapter経由でローカルファイルに保存

---

## C8: UIShell

**責務**: アプリケーションのUI構造とレイアウト

- サイドバー（ファイルツリー、設定アクセス）
- タブバー（開いているファイルのタブ管理）
- ツールバー（書式ボタン、投稿ボタン）
- ステータスバー（保存状態、文字数等）
- スラッシュコマンドパレット
- モーダル/ダイアログ（設定画面、投稿設定、確認ダイアログ）

---

## C9: FileSystemAdapter

**責務**: ファイルシステム操作の環境別抽象化

- 共通インターフェース: readFile, writeFile, readDir, mkdir, rename, delete, exists
- **TauriAdapter**: Tauri File System API（`@tauri-apps/plugin-fs`）を使用
- **WebAdapter**: File System Access API（`window.showOpenFilePicker`等）を使用
- 実行環境の自動検出と適切なアダプターの選択
