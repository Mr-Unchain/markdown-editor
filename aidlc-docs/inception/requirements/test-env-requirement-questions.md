# 自動テスト環境 — 要件確認質問

以下の質問に回答して、自動テスト環境の要件を明確にしてください。
各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

## Question 1

CI/CD パイプラインで使用するプラットフォームはどれですか？

A) GitHub Actions
B) GitLab CI/CD
C) CircleCI
D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 2

CI/CD パイプラインのトリガー条件はどれにしますか？

A) Push と Pull Request の両方（すべてのブランチ）
B) Pull Request のみ（main ブランチへのマージ時）
C) Push のみ（main ブランチへの直接 push 時）
D) Push と Pull Request の両方（main ブランチ関連のみ）
E) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 3

CI パイプラインで実行したいチェックをすべて選んでください（複数選択可、カンマ区切り）。

A) ユニットテスト（vitest run）
B) 型チェック（svelte-check）
C) リント（eslint）
D) フォーマットチェック（prettier --check）
E) カバレッジ計測と閾値チェック
F) すべて（A〜E 全部）
G) Other (please describe after [Answer]: tag below)

[Answer]:F

## Question 4

テストカバレッジの最低閾値はどの程度にしますか？

A) 厳密（行: 80%, 分岐: 70%, 関数: 80%）
B) 標準（行: 60%, 分岐: 50%, 関数: 60%）
C) 緩め（行: 40%, 分岐: 30%, 関数: 40%）
D) 閾値なし（カバレッジ計測のみ、強制しない）
E) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 5

Pre-commit hooks（コミット前の自動チェック）を導入しますか？

A) はい — lint-staged + husky で、変更ファイルのみ lint + format を実行
B) はい — lint-staged + husky で、変更ファイルの lint + format + テスト を実行
C) いいえ — Pre-commit hooks は不要
D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 6

Tauri（Rust）側のテスト・ビルドチェックも CI に含めますか？

A) はい — cargo test と cargo clippy を CI に含める
B) はい — cargo test のみ含める
C) いいえ — フロントエンド（Svelte/TypeScript）のみで十分
D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Question 7

ブランチ保護ルール（GitHub Branch Protection）の設定は必要ですか？

A) はい — CI パス必須 + レビュー必須で main を保護
B) はい — CI パス必須のみで main を保護（レビューは不要）
C) いいえ — ブランチ保護は不要
D) Other (please describe after [Answer]: tag below)

[Answer]:A
