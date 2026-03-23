# U4 Platform Integration — Functional Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を追記してください。

---

## Question 1
Zenn連携の技術的なアプローチはどちらを希望しますか？

A) GitHub連携方式（Zenn CLIのようにGitHubリポジトリにpushして記事を管理する）
B) Zenn API方式（Zennが提供するAPIを直接呼び出して記事を投稿する）
C) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 2
画像のローカル保存先はどのような構成にしますか？

A) ワークスペースルート直下の `images/` フォルダに一括保存
B) 各Markdownファイルと同階層に `{ファイル名}.assets/` フォルダを作成して保存（Typora方式）
C) ワークスペースルート直下の `.assets/` フォルダにハッシュ名で一括保存
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 3
画像挿入時のファイル名の扱いはどうしますか？

A) 元のファイル名をそのまま使用する
B) タイムスタンプベースの一意な名前に自動リネームする（例: `img-20260323-001.png`）
C) ハッシュベースの一意な名前にする（例: `a1b2c3d4.png`）
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]D

---

## Question 4
エクスポート時にMarkdown内の画像パスをどう扱いますか？

A) ローカルパスのまま（画像は別途手動で管理）
B) Base64埋め込みに変換する（HTMLエクスポート時のみ）
C) 画像パスはそのまま、ユーザーが投稿先で手動アップロード
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 5
投稿ダイアログのUI構成はどの程度のリッチさを望みますか？

A) シンプル（タイトル、タグ、公開/下書きの最低限）
B) 標準（A + プレビュー、カテゴリ選択、前回投稿との差分表示）
C) リッチ（B + SEOメタデータ入力、スケジュール投稿、複数プラットフォーム同時投稿）
D) お任せ（MVP向けに最適なレベルを推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 6
投稿済み記事の更新（再投稿）時の動作はどうしますか？

A) 常に上書き更新する（確認なし）
B) 差分プレビューを表示してから更新する
C) 新規下書きとして別途保存する（上書きしない）
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 7
プラットフォーム接続設定画面のUI配置はどこが良いですか？

A) サイドバー内の設定パネル
B) 独立したモーダルダイアログ（設定画面）
C) ツールバーからアクセスできるドロップダウンメニュー
D) お任せ（最適な配置を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:B

---

## Question 8
投稿失敗時のリトライ動作はどうしますか？

A) 自動リトライしない（手動で再投稿）
B) 自動リトライ（最大3回、指数バックオフ）
C) ユーザーに再試行を促すダイアログを表示する
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 9
エクスポートメニューのアクセス方法はどうしますか？

A) ツールバーの「エクスポート」ボタンからドロップダウン
B) メニューバー（File > Export）
C) コマンドパレット（スラッシュコマンド）からアクセス
D) A + C の両方（ツールバー + スラッシュコマンド）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 10
投稿履歴（どの記事をいつどのプラットフォームに投稿したか）を管理しますか？

A) MVPでは管理しない（投稿ごとに独立）
B) ワークスペース設定ファイルに記事ID・URL・日時を記録する
C) 各Markdownファイルのfrontmatterに投稿情報を埋め込む
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---
