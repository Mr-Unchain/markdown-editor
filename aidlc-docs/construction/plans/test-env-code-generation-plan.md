# Code Generation Plan — 自動テスト環境

## Unit Context

- **Unit**: 自動テスト環境（単一ユニット）
- **Workspace Root**: `C:\Git\markdown editor`
- **App Root**: `C:\Git\markdown editor\markdown-editor`
- **Rust Root**: `C:\Git\markdown editor\markdown-editor\src-tauri`

## Code Generation Steps

### Step 1: カバレッジプロバイダーのインストールと設定

- [ ] `@vitest/coverage-v8` を devDependencies に追加
- [ ] `vite.config.ts` に coverage 設定を追加（閾値: 行80%, 分岐70%, 関数80%）
- [ ] `package.json` の `test:coverage` スクリプトが正しく動作することを確認

**対象ファイル（修正）**:
- `markdown-editor/package.json` — devDependencies 追加
- `markdown-editor/vite.config.ts` — test.coverage セクション追加

### Step 2: GitHub Actions — フロントエンド CI ワークフロー

- [ ] `.github/workflows/ci.yml` を作成
- [ ] トリガー: push + pull_request（全ブランチ）
- [ ] Node.js バージョン: 20（LTS）
- [ ] pnpm を使用（既存の pnpm-lock.yaml に合わせる）
- [ ] ジョブ内容:
  - dependencies インストール（pnpm install）
  - lint（eslint）
  - format チェック（prettier --check）
  - 型チェック（svelte-check）
  - テスト + カバレッジ（vitest run --coverage）
- [ ] キャッシュ: pnpm store + node_modules

**対象ファイル（新規）**:
- `.github/workflows/ci.yml`

### Step 3: GitHub Actions — Rust CI ワークフロー

- [ ] `.github/workflows/rust.yml` を作成
- [ ] トリガー: push + pull_request（全ブランチ）
- [ ] Rust toolchain: stable
- [ ] ジョブ内容:
  - cargo clippy（警告をエラーとして扱う）
  - cargo test
  - cargo fmt --check
- [ ] キャッシュ: cargo registry + target ディレクトリ
- [ ] Tauri のシステム依存ライブラリのインストール（Linux 用）

**対象ファイル（新規）**:
- `.github/workflows/rust.yml`

### Step 4: husky + lint-staged のセットアップ

- [ ] `husky` と `lint-staged` を devDependencies に追加
- [ ] `package.json` に `lint-staged` 設定を追加
  - `*.{ts,js}`: eslint --fix
  - `*.{ts,js,svelte,json,css,md}`: prettier --write
- [ ] `package.json` に `prepare` スクリプト追加（`husky`）
- [ ] `.husky/pre-commit` フックファイルを作成

**対象ファイル（修正）**:
- `markdown-editor/package.json` — devDependencies, scripts, lint-staged 追加

**対象ファイル（新規）**:
- `markdown-editor/.husky/pre-commit`

### Step 5: ブランチ保護ルール設定手順書

- [ ] GitHub UI でのブランチ保護設定手順を文書化
- [ ] 必須ステータスチェック（ci, rust）の設定方法
- [ ] レビュー必須の設定方法

**対象ファイル（新規）**:
- `aidlc-docs/construction/test-env/branch-protection-guide.md`

### Step 6: format チェックスクリプトの追加

- [ ] `package.json` に `format:check` スクリプトを追加（`prettier --check .`）
- [ ] CI で使用する read-only フォーマットチェック用

**対象ファイル（修正）**:
- `markdown-editor/package.json`

## Summary

| Step | 種別 | 対象ファイル数 |
|---|---|---|
| 1. カバレッジ設定 | 修正 | 2 |
| 2. Frontend CI | 新規 | 1 |
| 3. Rust CI | 新規 | 1 |
| 4. husky + lint-staged | 修正+新規 | 2 |
| 5. ブランチ保護手順書 | 新規 | 1 |
| 6. format:check スクリプト | 修正 | 1 |

**合計**: 修正 3 ファイル、新規 4 ファイル
