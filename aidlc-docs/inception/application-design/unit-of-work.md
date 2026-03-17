# Unit of Work 定義

## ユニット一覧

| Unit | 名前 | 開発順序 | ストーリー数 |
|---|---|---|---|
| U1 | Foundation | 1st | 0 (基盤) |
| U2 | Core Editor | 2nd | 8 (MVP) |
| U3 | File Management | 3rd | 3 (MVP) |
| U4 | Platform Integration | 4th | 5 (MVP) |

---

## U1: Foundation

**責務**: アプリケーションの基盤レイヤーとUIスケルトンの構築

### 含まれるコンポーネント
- **C9: FileSystemAdapter** — TauriAdapter / WebAdapter の実装
- **C7: SettingsManager** — 設定の読み書き・永続化
- **C8: UIShell（骨格）** — アプリケーションレイアウト（サイドバー枠、タブバー枠、メインエリア、ステータスバー）

### 成果物
- SvelteKit + Tauri プロジェクトの初期セットアップ
- FileSystemAdapter インターフェースと両実装
- SettingsManager（JSON設定ファイルの読み書き）
- UIShellの基本レイアウト（空のコンテナ）
- 共通型定義

### MVPストーリー
なし（基盤ユニット — 他ユニットの前提条件）

### 完了条件
- Tauriアプリが起動し空のUIシェルが表示される
- Web版がブラウザで表示される
- FileSystemAdapterがファイルの読み書きを実行できる
- SettingsManagerが設定を保存・読み込みできる

---

## U2: Core Editor

**責務**: WYSIWYGマークダウン編集エンジンの実装

### 含まれるコンポーネント
- **C1: EditorCore** — Tiptap v2 エディターエンジン
- **C3: PluginSystem** — プラグイン基盤（マニフェスト読み込み、有効/無効管理）
- **C8: UIShell（ツールバー、コマンドパレット）** — 書式ツールバー、スラッシュコマンド

### 成果物
- Tiptapエディターの初期化と基本エクステンション
- WYSIWYG編集（見出し、太字、斜体、リスト、テーブル、コードブロック、引用、リンク）
- スラッシュコマンドパレット
- キーボードショートカット
- Undo/Redo
- PluginSystem基盤（マニフェスト管理、エクステンション登録API）

### MVPストーリー
| ID | ストーリー |
|---|---|
| US-01 | リッチテキスト編集 |
| US-02 | リスト・チェックリスト編集 |
| US-03 | テーブル編集 |
| US-04 | コードブロック編集 |
| US-05 | 引用・区切り線・リンク |
| US-06 | スラッシュコマンド |
| US-07 | キーボードショートカット |
| US-08 | Undo/Redo |

### 完了条件
- WYSIWYGモードで全書式要素が編集可能
- スラッシュコマンドで要素が挿入できる
- Markdown入力が自動変換される
- Undo/Redoが動作する

---

## U3: File Management

**責務**: ワークスペース型ファイル管理とタブ編集の実装

### 含まれるコンポーネント
- **C2: FileManager** — ファイルCRUD、タブ管理、変更追跡
- **C8: UIShell（サイドバー、タブバー）** — ファイルツリー、タブUI
- **S2: WorkspaceService** — ワークスペース初期化・セッション復元

### 成果物
- ワークスペース（フォルダ）の開閉
- サイドバーのファイルツリー表示
- ファイルのCRUD操作（作成、保存、名前変更、削除）
- 複数タブでのファイル切り替え
- 未保存変更の追跡と警告
- セッション復元（前回のワークスペースとタブを復元）

### MVPストーリー
| ID | ストーリー |
|---|---|
| US-09 | ワークスペース管理 |
| US-10 | ファイル操作 |
| US-11 | 複数タブ編集 |

### 完了条件
- フォルダを開いてファイルツリーが表示される
- ファイルの作成・保存・名前変更・削除ができる
- 複数ファイルをタブで切り替えて編集できる
- アプリ再起動後に前回の状態が復元される

---

## U4: Platform Integration

**責務**: プラットフォーム連携、画像管理、エクスポート機能の実装

### 含まれるコンポーネント
- **C4: PlatformAdapter（ZennAdapter）** — Zenn連携の実装
- **C5: ImageManager** — 画像挿入・アップロード
- **C6: ExportService** — Markdown/HTML変換、クリップボードコピー
- **S1: PublishService** — 投稿オーケストレーション
- **C7: SettingsManager（認証情報管理）** — プラットフォーム認証設定UI
- **C8: UIShell（投稿ダイアログ、設定画面）** — 投稿UI、接続設定UI

### 成果物
- Zenn連携（認証、記事投稿、画像アップロード）
- 画像のドラッグ&ドロップ挿入
- プラットフォーム投稿時の画像自動アップロード
- HTML/Markdownエクスポート（クリップボードコピー、ファイルダウンロード）
- プラットフォーム接続設定UI
- 投稿ダイアログ（タイトル、タグ、公開設定）

### MVPストーリー
| ID | ストーリー |
|---|---|
| US-12 | Zenn記事投稿 |
| US-16 | プラットフォーム向けエクスポート |
| US-17 | 画像挿入 |
| US-18 | プラットフォーム画像アップロード |
| US-22 | プラットフォーム接続設定 |

### 完了条件
- Zennに記事を下書き投稿できる
- 画像がドラッグ&ドロップで挿入できる
- 投稿時に画像が自動アップロードされる
- HTML/Markdownとしてコピー・ダウンロードできる
- 接続設定画面でZennの認証情報を管理できる

---

## コード構成戦略（ディレクトリ構造）

```
markdown-editor/                    # プロジェクトルート
+-- src/
|   +-- lib/
|   |   +-- core/
|   |   |   +-- editor/             # C1: EditorCore (Tiptap)
|   |   |   |   +-- extensions/     # 組み込みエクステンション
|   |   |   |   +-- commands/       # エディターコマンド
|   |   |   +-- file-manager/       # C2: FileManager
|   |   |   +-- plugin-system/      # C3: PluginSystem
|   |   |   +-- image-manager/      # C5: ImageManager
|   |   +-- integration/
|   |   |   +-- platform/           # C4: PlatformAdapter
|   |   |   |   +-- zenn/           # ZennAdapter
|   |   |   |   +-- types.ts        # 共通インターフェース
|   |   |   +-- export/             # C6: ExportService
|   |   +-- infrastructure/
|   |   |   +-- fs-adapter/         # C9: FileSystemAdapter
|   |   |   |   +-- tauri.ts        # TauriAdapter
|   |   |   |   +-- web.ts          # WebAdapter
|   |   |   +-- settings/           # C7: SettingsManager
|   |   +-- services/
|   |   |   +-- publish.ts          # S1: PublishService
|   |   |   +-- workspace.ts        # S2: WorkspaceService
|   |   +-- stores/                 # Svelte Stores (共有状態)
|   |   +-- types/                  # 共通型定義
|   +-- routes/                     # SvelteKit ページ
|   |   +-- +layout.svelte          # UIShell レイアウト
|   |   +-- +page.svelte            # メインエディターページ
|   +-- components/                 # C8: UIShell Svelteコンポーネント
|   |   +-- sidebar/
|   |   +-- tabs/
|   |   +-- toolbar/
|   |   +-- editor/
|   |   +-- dialogs/
|   |   +-- status-bar/
+-- src-tauri/                      # Tauri バックエンド (Rust)
|   +-- src/
|   +-- Cargo.toml
|   +-- tauri.conf.json
+-- plugins/                        # 同梱プラグイン
|   +-- katex/
|   +-- mermaid/
|   +-- zenn-syntax/
+-- static/                         # 静的アセット
+-- package.json
+-- svelte.config.js
+-- tsconfig.json
+-- vite.config.ts
```
