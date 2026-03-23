# U4 Platform Integration — NFR Requirements 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

---

## Question 1
投稿操作（画像アップロード含む）の許容時間はどの程度ですか？

A) 5秒以内（高速。画像が少ない前提）
B) 15秒以内（標準。数枚の画像アップロード含む）
C) 30秒以内（大量画像がある場合も許容）
D) 時間制限なし（進捗表示があればOK）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 2
画像アップロード前にリサイズ・圧縮を自動で行いますか？

A) 行わない（元画像のままアップロード）
B) 大きな画像のみリサイズ（例: 2000px超を自動縮小）
C) 全画像を自動最適化（リサイズ+WebP変換等）
D) お任せ（MVP向けに最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 3
オフライン時のエクスポート機能はどうしますか？

A) エクスポート（MD/HTMLコピー・ダウンロード）はオフラインでも完全動作させる
B) エクスポートもオンライン必須
C) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 4
HTMLエクスポート時にユーザー入力コンテンツのサニタイズはどの程度行いますか？

A) サニタイズなし（エディター出力をそのまま使用）
B) scriptタグ・イベントハンドラのみ除去
C) 完全なDOMPurify等によるサニタイズ
D) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 5
外部APIへの依存をテストする戦略はどうしますか？

A) GitHub APIをモックしてユニットテストのみ
B) モック + 実際のAPIを使うE2Eテスト（テストリポジトリ使用）
C) お任せ（最適なテスト戦略を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 6
frontmatter（YAML）のパース・シリアライズに使用するライブラリはどうしますか？

A) gray-matter（最もポピュラー、Zenn CLIでも使用）
B) yaml（js-yamlの後継、最新仕様対応）
C) 自前パーサー（外部依存なし）
D) お任せ（最適なライブラリを推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 7
GitHub API クライアントはどのように実装しますか？

A) Octokit（GitHub公式SDK）
B) 軽量な自前HTTP クライアント（fetch API ベース）
C) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

---
