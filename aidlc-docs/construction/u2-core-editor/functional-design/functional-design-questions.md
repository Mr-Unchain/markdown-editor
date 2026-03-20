# U2: Core Editor — Functional Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
選択肢に合うものがない場合は、最後の「Other」を選び、説明を追記してください。

---

## Question 1
Markdown記法の自動変換はどの範囲までサポートしますか？（例: `**太字**` → **太字**）

A) 基本的なインライン記法のみ（太字、斜体、コード、取り消し線）
B) インライン + ブロック記法（見出し `#`、リスト `-`/`1.`、引用 `>`、コードブロック ``` ）
C) 上記に加え、GFM拡張（テーブル `|---|`、タスクリスト `- [ ]`、脚注）も含む
D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 2
コードブロックのシンタックスハイライトにはどのライブラリを使用しますか？

A) highlight.js（軽量、言語数豊富、Tiptap公式サンプルあり）
B) Shiki（VS Code互換のテーマ・精度、WASM依存あり）
C) Prism.js（中程度の軽さ、プラグイン豊富）
D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 3
スラッシュコマンドパレットのUI表示位置とスタイルはどうしますか？

A) カーソル直下にドロップダウン（Notion風 — インラインポップアップ）
B) 画面中央にモーダル（VS Code風 — コマンドパレット）
C) サイドバーにパネル表示
D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 4
テーブル編集の高度な機能はどこまで必要ですか？

A) 基本のみ（挿入、セル編集、行列追加・削除、セル間Tab移動）
B) 基本 + セル結合・分割
C) 基本 + セル結合 + 列幅のドラッグリサイズ
D) 基本 + セル結合 + リサイズ + セル背景色
E) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 5
PluginSystemの初期MVP範囲はどうしますか？

A) 内部エクステンション管理のみ（マニフェスト読み込み、有効/無効管理 — 外部プラグインは後回し）
B) 内部管理 + 同梱プラグイン3種（KaTeX, Mermaid, Zenn構文）のロード機構まで
C) 同梱プラグイン + 外部プラグインディレクトリからの動的読み込み
D) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 6
ツールバーの表示形式はどうしますか？

A) 固定ツールバー（エディター上部に常時表示 — 伝統的なエディタースタイル）
B) バブルメニュー（テキスト選択時にフローティング表示 — Medium/Notion風）
C) 固定ツールバー + バブルメニューの併用（基本操作は固定、テキスト選択時は追加のバブル）
D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 7
リンク編集のUXはどうしますか？

A) テキスト選択 → ツールバーボタンでURLダイアログ表示 → 挿入
B) テキスト選択 → インラインポップオーバーでURL入力（Notion風）
C) URLペーストで自動リンク化 + クリックでポップオーバー編集
D) B + C の併用（インラインポップオーバー + 自動リンク化）
E) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 8
エディターの初期コンテンツ（新規ファイル作成時）はどうしますか？

A) 完全に空のドキュメント
B) テンプレート選択（ブログ記事テンプレート、技術記事テンプレート等）
C) H1見出しのプレースホルダー（「タイトルを入力...」）のみ
D) Other (please describe after [Answer]: tag below)

[Answer]:C
