# 自動テスト環境 — 要件定義

## Intent Analysis

- **User Request**: 自動テスト環境を整えたい
- **Request Type**: Enhancement（既存プロジェクトへのインフラ追加）
- **Scope**: Multiple Components（CI/CD, カバレッジ, pre-commit hooks, ブランチ保護）
- **Complexity**: Moderate（複数ツールの統合だが、各要素は標準的な構成）

## 現状

- **テストフレームワーク**: Vitest v2.x（jsdom, 55ファイル, 472テスト）
- **既存スクリプト**: `test`, `test:run`, `test:coverage`, `lint`, `format`, `check`
- **不足**: CI/CD パイプライン、カバレッジプロバイダー、pre-commit hooks、ブランチ保護

---

## Functional Requirements

### FR-01: GitHub Actions CI/CD パイプライン

- **プラットフォーム**: GitHub Actions
- **トリガー**: Push と Pull Request の両方（すべてのブランチ）
- **実行チェック**:
  1. ユニットテスト（`vitest run`）
  2. 型チェック（`svelte-check`）
  3. リント（`eslint`）
  4. フォーマットチェック（`prettier --check`）
  5. カバレッジ計測と閾値チェック

### FR-02: Tauri（Rust）CI チェック

- `cargo test` の実行
- `cargo clippy` によるリント
- フロントエンドとは別ジョブまたは並列ステップで実行

### FR-03: テストカバレッジ

- **プロバイダー**: `@vitest/coverage-v8` をインストール
- **閾値（厳密）**:
  - 行カバレッジ: 80%
  - 分岐カバレッジ: 70%
  - 関数カバレッジ: 80%
- CI で閾値未達の場合はビルド失敗とする

### FR-04: Pre-commit Hooks

- **ツール**: husky + lint-staged
- **対象**: 変更ファイルのみ
- **実行内容**: lint（eslint --fix）+ format（prettier --write）
- テストはコミット時には実行しない（CI に委任）

### FR-05: ブランチ保護ルール

- main ブランチを保護
- CI パスを必須条件とする
- Pull Request レビューを必須とする
- ドキュメントとして設定手順を記載（GitHub UI での手動設定）

---

## Non-Functional Requirements

### NFR-01: CI 実行時間

- フロントエンドチェック全体が 5 分以内に完了すること（目標）
- Rust チェックはキャッシュ活用で 10 分以内（目標）

### NFR-02: 保守性

- ワークフロー定義は読みやすく、各ジョブの責務が明確であること
- Node.js / Rust のバージョンは明示的に指定すること

### NFR-03: 信頼性

- CI の flaky test 対策として、テスト環境は deterministic であること
- キャッシュ（node_modules, cargo）を活用し、再現性と速度を両立

---

## Extension Configuration

| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | No | Requirements Analysis (前回決定を継続) |

※ 自動テスト環境の構築はインフラ/DX 改善であり、セキュリティ拡張の対象外。
