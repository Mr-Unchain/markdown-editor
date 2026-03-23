# U4 Platform Integration — NFR Design 質問

NFR要件が詳細なため、質問は2件のみです。

---

## Question 1
投稿パイプライン中のキャンセル操作をどの範囲でサポートしますか？

A) いつでもキャンセル可能（進行中のAPI呼び出しもAbortControllerで中断）
B) ステップ間のみキャンセル可能（進行中のAPI呼び出しは完了を待つ）
C) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 2
GitHubApiClientの認証情報を実行時にどのタイミングで取得しますか？

A) アプリ起動時にメモリにロードし保持（高速だがメモリ上に常時存在）
B) API呼び出し直前に毎回SecureStorageから取得（安全だがオーバーヘッド）
C) お任せ（最適な方式を推奨してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]:C

---
