# U1: Foundation - Functional Design Plan

## 概要
アプリケーション基盤（FileSystemAdapter, SettingsManager, UIShell骨格）の詳細設計。

## ユニットコンテキスト
- **ユニット**: U1: Foundation
- **コンポーネント**: C9 FileSystemAdapter, C7 SettingsManager, C8 UIShell(骨格)
- **MVPストーリー**: なし（基盤ユニット）
- **依存先**: なし（最初のユニット）

---

## 設計チェックリスト

### Part 1: ドメインエンティティ
- [x] FileSystemAdapter関連の型定義（DirEntry, FileContent, FileFilter, FileSystemError）
- [x] Settings関連の型定義（AppSettings, PlatformCredentials, PluginConfig）
- [x] UIShell関連の型定義（LayoutState, SidebarPanel, Notification）
- [x] SecureStorage関連の型定義（SecureStorage interface）

### Part 2: ビジネスロジック
- [x] FileSystemAdapter: 環境検出ロジック（Tauri vs Web）
- [x] SettingsManager: 設定ファイルの読み込み・保存・デフォルト値
- [x] SettingsManager: 認証情報のセキュアな保存方式（Stronghold/localStorage）

### Part 3: ビジネスルール
- [x] FileSystemAdapter: エラーハンドリングルール
- [x] SettingsManager: バリデーションルール
- [x] UIShell: レイアウト制約
- [x] SecureStorage: 認証情報保存・Web版警告ルール

### Part 4: フロントエンドコンポーネント
- [x] UIShell レイアウト構成（コンポーネント階層）
- [x] レイアウト状態管理（サイドバー開閉、パネルサイズ）
- [x] Svelte Store定義

---

## 質問

### Question 1
UIShellのレイアウトとして、どのスタイルを好みますか？

A) VS Code風 — 左サイドバー（ファイルツリー）＋中央エディター＋下部ステータスバー。開発者に馴染みのあるレイアウト
B) Typora風 — シンプルな単一ペイン。サイドバーはトグルで表示/非表示。執筆に集中しやすい
C) Notion風 — 左ナビゲーション＋広いエディターエリア。モダンで洗練されたデザイン
X) Other（[Answer]: タグの後にご希望を記述してください）

[Answer]:B

### Question 2
認証情報（APIキー等）の保存方式について、どの程度のセキュリティが必要ですか？

A) OS標準のキーチェーン/資格情報マネージャーを使用 — Tauri: keytar/keyring、Web: 利用不可（入力都度求める）
B) 設定ファイル内に暗号化して保存 — アプリ固有の暗号化キーで保護
C) 設定ファイルにプレーンテキストで保存 — 最もシンプル、セキュリティルールはスキップ済みなので許容
X) Other（[Answer]: タグの後にご希望を記述してください）

[Answer]:X どれがいいかわかりませんが、AかBのどちらかよいほうを採用したいです。
