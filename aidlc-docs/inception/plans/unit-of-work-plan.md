# Unit of Work Plan

## 概要
MVPの16ストーリーを開発可能なユニットに分解する。本プロジェクトはモノリスアプリ（SvelteKit + Tauri）のため、ユニットは「論理モジュール」として整理し、依存順序に基づく開発シーケンスを定義する。

---

## 推奨ユニット分解案

依存関係とコンポーネント境界に基づき、以下の4ユニットを提案する:

| Unit | 名前 | 主要コンポーネント | MVP ストーリー |
|---|---|---|---|
| U1 | Foundation | FileSystemAdapter, SettingsManager, UIShell(骨格) | — (基盤) |
| U2 | Core Editor | EditorCore, UIShell(ツールバー, コマンドパレット) | US-01~US-08 (8件) |
| U3 | File Management | FileManager, UIShell(サイドバー, タブ), WorkspaceService | US-09~US-11 (3件) |
| U4 | Platform Integration | PlatformAdapter(Zenn), ExportService, ImageManager, PublishService, SettingsManager(認証) | US-12, US-16~US-18, US-22 (5件) |

### 開発シーケンス（推奨）

```
U1: Foundation --> U2: Core Editor --> U3: File Management --> U4: Platform Integration
```

- **U1 → U2**: エディターはUIShell骨格とFileSystemAdapterに依存
- **U2 → U3**: ファイル管理はエディターに依存（ファイル内容の表示・保存）
- **U3 → U4**: プラットフォーム連携はファイル管理と エディターに依存（記事コンテンツ取得）

---

## 質問

### Question 1
上記の4ユニット分解と開発シーケンスで進めてよいですか？

A) はい — この4ユニット構成と順序で進める
B) U1とU2を統合 — Foundation + Core Editorを1つのユニットにまとめて3ユニットにする（開発ステップが少なくなる）
C) U3とU4を統合 — File Management + Platform Integrationを1つにまとめて3ユニットにする
D) 全て統合 — 1つの大きなユニットとして扱う（CONSTRUCTION phaseのループが1回で済む）
X) Other（[Answer]: タグの後にご希望を記述してください）

[Answer]:A

### Question 2
各ユニットの設計段階（Functional Design, NFR Requirements, NFR Design）について、どの程度の深さで実施しますか？

A) 全ユニット同じ深さ — 各ユニットで Functional Design + NFR Requirements + NFR Design を実施
B) U2(Core Editor)とU4(Platform)は深く、U1(Foundation)とU3(File Management)は軽く — 複雑なユニットのみ詳細設計
C) U1は設計スキップ（コード生成のみ）、U2-U4は設計あり — 基盤は設計不要
X) Other（[Answer]: タグの後にご希望を記述してください）

[Answer]:A

---

## 生成チェックリスト

### Part 1: ユニット定義
- [x] 各ユニットの詳細定義（責務、含まれるコンポーネント、ストーリー）
- [x] コード構成戦略（ディレクトリ構造）

### Part 2: 依存関係
- [x] ユニット間依存関係マトリックス
- [x] 開発シーケンス図

### Part 3: ストーリーマッピング
- [x] 全MVPストーリーのユニット割り当て
- [x] Post-MVPストーリーのユニット割り当て
- [x] 割り当て漏れチェック
