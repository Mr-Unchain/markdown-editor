# U2: Core Editor — NFR Requirements 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。

---

## Question 1
エディターの入力遅延（キーストロークからレンダリングまで）の許容範囲はどれですか？

A) 16ms以下（60fps — ゲーミング水準、ネイティブアプリ並み）
B) 50ms以下（人間の知覚閾値以下 — 一般的なテキストエディターの基準）
C) 100ms以下（ブラウザベースエディターとしては十分 — Notion/Google Docs水準）
D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 2
エディターが安定して扱えるドキュメントサイズの目標はどれですか？（ブログ記事の想定サイズ基準）

A) 小規模（〜50KB / 〜5,000文字 — 短い記事）
B) 中規模（〜200KB / 〜20,000文字 — 一般的な技術記事）
C) 大規模（〜1MB / 〜100,000文字 — 長編チュートリアル・連載記事）
D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 3
コードブロックのシンタックスハイライトで、言語をどの程度バンドルしますか？（バンドルサイズとのトレードオフ）

A) 最小限（主要10言語程度 — JS, TS, Python, HTML, CSS, JSON, Shell, Go, Rust, SQL）バンドルサイズ優先
B) 中程度（US-04で定義した16言語をバンドル）バランス重視
C) 全言語（highlight.jsの全言語 — 190+言語）利便性優先
D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 4
アクセシビリティ対応のレベルはどれですか？

A) 基本的なキーボード操作対応のみ（Tab, Escape, 矢印キー等が動作する）
B) WCAG 2.1 AA準拠（ARIAラベル、フォーカス管理、スクリーンリーダー対応）
C) WCAG 2.1 AAA準拠（最高水準のアクセシビリティ）
D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 5
同梱プラグイン（KaTeX, Mermaid, Zenn構文）のロード戦略はどうしますか？

A) 全て初期ロード（起動時に全プラグインをインポート）シンプルだが起動時間に影響
B) 遅延ロード（該当構文が使用された時点で初めてインポート）起動時間優先
C) ユーザー操作時ロード（設定画面でプラグイン有効化した後、次回エディター初期化時にロード）
D) Other (please describe after [Answer]: tag below)

[Answer]:B
