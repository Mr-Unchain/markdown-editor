# Application Design 統合ドキュメント

## 概要

ブログ記事執筆用マークダウンエディターのアプリケーション設計。Tauri + SvelteKit + Tiptap によるハイブリッドアプリ。

## 技術スタック

| カテゴリ | 選定 | 理由 |
|---|---|---|
| フロントエンド | SvelteKit + TypeScript | 軽量、高速起動、バンドルサイズ小 |
| デスクトップ | Tauri v2 | Rust製、Electronより大幅に軽量 |
| エディター | Tiptap v2 (ProseMirror) | 高レベルAPI、拡張容易、WYSIWYG最適 |
| 状態管理 | Svelte Store | SvelteKitネイティブ、追加依存なし |
| FS抽象化 | アダプターパターン | 明確な関心分離、テスト容易 |
| プラグイン管理 | 設定ファイルベース | JSON設定でON/OFF、アプリ同梱 |

## アーキテクチャ概要

```
+-----------------------------------------------------------+
|                    Presentation Layer                      |
|  C8: UIShell (Sidebar, TabBar, Toolbar, Dialogs)          |
+-----------------------------------------------------------+
|                    Service Layer                           |
|  S1: PublishService  |  S2: WorkspaceService              |
+-----------------------------------------------------------+
|                      Core Layer                           |
|  C1: EditorCore | C2: FileManager | C3: Plugin | C5: Img |
+-----------------------------------------------------------+
|                  Integration Layer                         |
|  C4: PlatformAdapter  |  C6: ExportService                |
+-----------------------------------------------------------+
|                 Infrastructure Layer                       |
|  C7: SettingsManager  |  C9: FileSystemAdapter            |
+-----------------------------------------------------------+
```

## コンポーネント一覧（9コンポーネント + 2サービス）

| ID | 名前 | レイヤー | 責務概要 |
|---|---|---|---|
| C1 | EditorCore | Core | Tiptap WYSIWYGエディターエンジン |
| C2 | FileManager | Core | ワークスペース・ファイルCRUD・タブ管理 |
| C3 | PluginSystem | Core | プラグイン登録・有効/無効・遅延読み込み |
| C4 | PlatformAdapter | Integration | プラットフォーム連携抽象化（Zenn, note, microCMS, Contentful） |
| C5 | ImageManager | Core | 画像挿入・保存・プラットフォームアップロード |
| C6 | ExportService | Integration | フォーマット変換（MD, HTML, Platform固有） |
| C7 | SettingsManager | Infrastructure | 設定・認証情報の永続化 |
| C8 | UIShell | Presentation | アプリUI構造（サイドバー、タブ、ツールバー） |
| C9 | FileSystemAdapter | Infrastructure | ファイルシステム環境別抽象化（Tauri/Web） |
| S1 | PublishService | Service | 記事投稿オーケストレーション |
| S2 | WorkspaceService | Service | ワークスペース初期化・セッション管理 |

## 主要データフロー

1. **記事執筆**: User → UIShell → EditorCore → Svelte Store → UIShell(表示更新)
2. **ファイル保存**: User(Ctrl+S) → FileManager → EditorCore.getMarkdown() → FileSystemAdapter
3. **記事投稿**: User → PublishService → EditorCore + ImageManager + ExportService + PlatformAdapter
4. **アプリ起動**: WorkspaceService → SettingsManager → FileManager → PluginSystem → UIShell

## 設計判断

| 判断 | 選択 | 根拠 |
|---|---|---|
| エディターエンジン | Tiptap v2 | ProseMirrorの高レベルラッパー。拡張容易、SvelteKit統合可 |
| プラグイン方式 | 設定ファイルベース | JSON設定でON/OFF。MVPに十分、将来的に動的読み込みへ拡張可能 |
| 状態管理 | Svelte Store | 追加依存なし、SvelteKitとシームレス統合、軽量 |
| FS抽象化 | アダプターパターン | FileSystemAdapterインターフェース + TauriAdapter / WebAdapter |

## 詳細ドキュメントへのリンク

- [コンポーネント定義](components.md)
- [コンポーネントメソッド](component-methods.md)
- [サービスレイヤー](services.md)
- [依存関係](component-dependency.md)
