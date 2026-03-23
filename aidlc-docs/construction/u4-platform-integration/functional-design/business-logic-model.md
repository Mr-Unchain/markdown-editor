# U4 Platform Integration — ビジネスロジックモデル

## 概要

U4は以下の5つのビジネスロジック領域を持つ:
1. **PlatformAdapter / ZennAdapter** — Zenn GitHub連携による記事投稿
2. **ImageManager** — 画像のローカル管理とプラットフォームアップロード
3. **ExportService** — フォーマット変換とエクスポート
4. **PublishService** — 投稿オーケストレーション
5. **SettingsManager拡張** — プラットフォーム認証情報管理

---

## 1. PlatformAdapter / ZennAdapter

### 1.1 ZennAdapter — GitHub連携方式

Zennの記事管理はGitHubリポジトリ連携が主要方式。ZennAdapterはGitHub APIを通じて記事ファイルの作成・更新を行う。

#### 認証フロー

```
1. ユーザーがGitHub Personal Access Tokenを入力
2. SettingsManager経由でSecureStorageに保存
3. 接続テスト: GitHub API → リポジトリ読み取り確認
4. 成功 → isConnected = true
```

**GitHub Token必要スコープ**: `repo`（リポジトリへの読み書き）

#### 記事投稿フロー

```
1. ArticlePayloadを受け取る
2. Zenn frontmatter形式に変換:
   ---
   title: "タイトル"
   emoji: "📝"
   type: "tech" | "idea"
   topics: ["tag1", "tag2"]
   published: true | false
   ---
   本文（Markdown）

3. slug生成（未指定の場合はランダム生成）
4. GitHub API: articles/{slug}.md ファイルを作成/更新
   - 新規: PUT /repos/{owner}/{repo}/contents/articles/{slug}.md
   - 更新: PUT（SHA指定で上書き）
5. 画像: images/ ディレクトリにアップロード
6. コミットメッセージ: "Add/Update article: {title}"
7. 結果を返却（articleUrl = https://zenn.dev/{user}/articles/{slug}）
```

#### 画像アップロードフロー

**注意**: Zenn GitHub連携では、画像はリポジトリの `images/` ディレクトリにコミットする。
Zennがリポジトリを同期する際、`images/` 内の画像はZenn CDN経由で配信される。
記事Markdown内の画像参照は `/images/{filename}` 形式（リポジトリルートからの相対パス）で記述する。
これはZennの標準的なGitHub連携仕様に準拠している。

```
1. ローカル画像ファイルをBase64エンコード
2. GitHub API: PUT /repos/{owner}/{repo}/contents/images/{filename}
   - Content-Type: application/json
   - Body: { message: "Add image: {filename}", content: "{base64}" }
   - 更新時: SHA指定必須（GET で現在のSHAを取得後）
3. アップロード後の参照パス: /images/{filename}
   - Zennがリポジトリ同期時にCDN URLへ自動解決
   - 記事Markdown内では /images/{filename} のまま記述
4. Markdown内の画像パスを /images/{filename} に置換
```

#### エラーハンドリング

| エラー | HTTPステータス | 対応 |
|---|---|---|
| 認証エラー | 401 Unauthorized | トークン無効 → 再認証を促す |
| リポジトリ未存在 | 404 Not Found | リポジトリ/パス未存在 → 設定確認を促す |
| SHA不一致 | 409 Conflict | 他で更新済み → 最新SHA取得→リトライ（下記参照） |
| 不正コンテンツ | 422 Unprocessable | 不正なファイル内容 → バリデーションエラー表示 |
| レート制限 | 403 + `X-RateLimit-Remaining: 0` | `X-RateLimit-Reset` ヘッダーからリセット時刻取得 → 「レート制限中。{N}秒後に再試行可能」表示 → カウントダウン付きリトライボタン |
| セカンダリレート制限 | 403 + `Retry-After` | `Retry-After` ヘッダーの秒数を表示 → 自動待機後リトライ |
| ネットワーク障害 | N/A | リトライダイアログ表示 |

#### 409 Conflict SHA不一致リトライシーケンス

```
PUT /contents/{path} → 409 Conflict
  |
  v
GET /repos/{owner}/{repo}/contents/{path}
  |-- 最新ファイルのSHA値を取得
  |-- レスポンス: { sha: "abc123...", content: "..." }
  |
  v
PUT /contents/{path} with updated sha
  |-- 成功 → 続行
  |-- 再度409 → エラー表示「ファイルが他で更新されています。手動で確認してください」
  |-- 最大リトライ: 1回（無限ループ防止）
```

### 1.2 PlatformAdapterRegistry

複数プラットフォームのアダプターを管理するレジストリ。

```
PlatformAdapterRegistry
  |-- register(adapter: PlatformAdapter): void
  |-- get(platformId: string): PlatformAdapter | undefined
  |-- getAll(): PlatformAdapter[]
  |-- getConnected(): PlatformAdapter[]  // isConnected = trueのもの
```

MVPではZennAdapterのみ登録。Post-MVPでnote/microCMS/Contentfulを追加。

---

## 2. ImageManager

### 2.1 画像挿入フロー

```
ユーザーアクション（D&D / ペースト / ファイル選択 / スラッシュコマンド）
  |
  v
受け取り処理
  |-- D&D: DragEvent → dataTransfer.files → File[]
  |-- ペースト: ClipboardEvent → clipboardData.files → File[]
  |-- ファイル選択: input[type=file] → FileList → File[]
  |-- スラッシュコマンド: `/image` → FileSystemAdapter.openFileDialog({ filters: [{ name: 'Images', extensions: ['png','jpg','jpeg','gif','webp','svg'] }] }) → File
  |
  v
バリデーション
  |-- MIMEタイプチェック（image/png, jpeg, gif, webp, svg+xml）
  |-- ファイルサイズチェック（上限: 5MB）
  |
  v
ファイル名生成
  |-- 形式: {元のファイル名（拡張子除去）}-{YYYYMMDDHHmmss}.{拡張子}
  |-- 例: screenshot-20260323143052.png
  |-- 衝突時: 末尾に連番付加（-001, -002）
  |
  v
ローカル保存
  |-- 保存先: {対象MDファイルと同階層}/{MDファイル名（拡張子除去）}.assets/
  |-- 例: articles/my-article.assets/screenshot-20260323143052.png
  |-- フォルダ未存在の場合は自動作成
  |
  v
Markdown挿入
  |-- エディターに挿入: ![{元のファイル名}](./{MDファイル名}.assets/{生成ファイル名})
  |-- 相対パス形式で挿入
```

### 2.2 プラットフォームアップロードフロー

```
PublishServiceからの呼び出し
  |
  v
ローカル画像の収集
  |-- Markdown本文からローカル画像参照を抽出
  |-- 正規表現: !\[.*?\]\((\.\/.*?\.assets\/.*?)\)
  |-- 各画像ファイルの存在確認
  |
  v
バッチアップロード（LocalImageRef[]を受け取る — component-methods.md C5の string[] から拡張）
  |-- 画像を順次（シーケンシャル）アップロード
  |-- 各画像: PlatformAdapter.uploadImage() を呼び出し
  |-- 進捗コールバック: (completed / total) を通知
  |
  v
URL置換
  |-- アップロード成功した画像のローカルパス → リモートURLに置換
  |-- 置換後のMarkdownを返却
  |
  v
失敗ハンドリング
  |-- 一部失敗: 成功分のみURL置換、失敗分は元のまま
  |-- 全失敗: エラーを返却、ローカルパスのまま
```

### 2.3 画像保存先ディレクトリ管理

```
workspace-root/
  articles/
    my-article.md
    my-article.assets/          ← 自動作成
      screenshot-20260323143052.png
      diagram-20260323150030.svg
    another-post.md
    another-post.assets/
      photo-20260324091500.jpg
```

- フォルダ名はMarkdownファイル名（拡張子除去）+ `.assets`
- Markdownファイルがリネームされた場合、assetsフォルダもリネーム（FileManager連携）
- Markdownファイルが削除された場合、assetsフォルダも削除（確認付き）

**リネーム時のMarkdown画像パス更新の責務**:
FileManager.renameFile() が以下を順に実行:
1. ファイルをリネーム
2. `{oldName}.assets/` → `{newName}.assets/` にリネーム（存在する場合）
3. リネーム後のファイル内容を読み込み、画像パス参照を一括置換
   - `./{oldName}.assets/` → `./{newName}.assets/`
4. 更新内容をファイルに保存

**注意**: US-18「Zenn投稿時にローカル画像がZennの画像ストレージにアップロードされる」について
→ Zenn GitHub連携では「Zennの画像ストレージ」= GitHubリポジトリの `images/` ディレクトリ。
ZennがGitHub同期時にこれらの画像をCDN経由で配信するため、結果的にZenn上で画像が表示される。
直接Zennの内部ストレージにアップロードするのではなく、GitHub経由の間接的なアップロードである。

---

## 3. ExportService

### 3.1 Markdown変換

```
ProseMirror Document
  |
  v
Tiptap serializer (editor.storage.markdown.getMarkdown())
  |-- Tiptap内蔵のMarkdownシリアライザを使用
  |-- カスタムエクステンション分はtransformerで対応
  |
  v
後処理
  |-- 不要な空行の正規化
  |-- frontmatter保持（存在する場合）
  |
  v
Markdown文字列
```

### 3.2 HTML変換

```
ProseMirror Document
  |
  v
Tiptap HTML serializer (editor.getHTML())
  |-- Tiptap内蔵のHTMLシリアライザを使用
  |
  v
後処理
  |-- 画像パスの処理:
  |   |-- HTMLエクスポート: ローカル画像をBase64埋め込み
  |   |-- コピー: ローカルパスのまま（ペースト先が処理）
  |-- コードブロックのシンタックスハイライトCSSインライン化
  |
  v
完全なHTML文字列（<html>ラッパー付き/なし選択可能）
```

### 3.3 Zenn Markdown変換

```
ProseMirror Document
  |
  v
標準Markdown変換
  |
  v
Zenn固有の後処理
  |-- frontmatter付加（title, emoji, type, topics, published）
  |-- Zenn記法の変換（将来: :::message, :::details等のプラグイン対応）
  |
  v
Zenn互換Markdown文字列
```

### 3.4 エクスポートアクション

| アクション | 処理 |
|---|---|
| **Markdownコピー** | ExportService.toMarkdown() → navigator.clipboard.writeText() |
| **HTMLコピー** | ExportService.toHTML() → navigator.clipboard.write([ClipboardItem]) リッチテキスト |
| **HTMLダウンロード** | ExportService.toHTML(fullDocument: true) → FileSystemAdapter.saveFileDialog() → writeFile() |
| **Markdownダウンロード** | ExportService.toMarkdown() → FileSystemAdapter.saveFileDialog() → writeFile() |

---

## 4. PublishService（オーケストレーション）

### 4.1 投稿パイプライン

```
publish(platformId, options)
  |
  v
Step 1: VALIDATE（バリデーション）
  |-- タイトル必須チェック
  |-- 本文空チェック
  |-- プラットフォーム接続確認
  |-- 認証情報有効性確認
  |
  v
Step 2: EXPORT（フォーマット変換）
  |-- EditorCore.getContent() → ProseMirror Doc取得
  |-- ExportService.toPlatformFormat(doc, platformId)
  |-- Zenn: frontmatter付きMarkdown生成
  |
  v
Step 3: UPLOAD-IMAGES（画像アップロード）
  |-- ImageManager.collectLocalImages(markdown) → LocalImageRef[]
  |-- ImageManager.uploadForPlatform(images, adapter)
  |-- 進捗: publishProgress.imageProgress を更新
  |
  v
Step 4: REPLACE-URLS（画像URL置換）
  |-- アップロード成功画像のURL置換
  |-- 置換後Markdownを生成
  |
  v
Step 5: PUBLISH（記事投稿）
  |-- 新規: adapter.publishDraft(payload) or adapter.publishArticle(payload)
  |-- 更新: adapter.updateArticle(id, payload)
  |   |-- 更新時: 確認ダイアログ表示
  |   |-- 「この記事は以前投稿済みです。上書き更新しますか？」
  |   |-- [更新する] / [新規として投稿] / [キャンセル]
  |
  v
Step 6: UPDATE-FRONTMATTER（frontmatter更新）
  |-- PublishRecord を記事ファイルのfrontmatterに書き込み
  |-- articleId, articleUrl, publishedAt, status を記録
  |
  v
Step 7: COMPLETE（完了）
  |-- 成功通知表示（記事URLリンク付き）
  |-- publishProgress を 'success' に更新
```

### 4.2 エラーリカバリ

```
いずれかのステップで失敗
  |
  v
PublishProgress.status = 'failed'
PublishProgress.error = { step, message, retryable }
  |
  v
リトライダイアログ表示
  |-- 「投稿に失敗しました: {message}」
  |-- 「ステップ: {step}」
  |-- [再試行] → 失敗したステップから再開
  |-- [キャンセル] → 投稿中止
  |
  v
画像アップロード部分失敗の場合:
  |-- 成功した画像のURL置換は保持
  |-- 失敗した画像のみ再アップロード対象
  |-- 「{n}件中{m}件の画像アップロードに失敗しました。再試行しますか？」
```

### 4.3 エクスポートフロー（API不要のプラットフォーム向け）

```
exportToClipboard(format)
  |
  v
EditorCore.getContent() → ProseMirror Doc
  |
  v
ExportService.toMarkdown() or toHTML()
  |
  v
navigator.clipboard.writeText() or write()
  |
  v
成功通知（トースト）: 「{format}としてコピーしました」

---

exportToFile(format, filename)
  |
  v
EditorCore.getContent() → ProseMirror Doc
  |
  v
ExportService.toMarkdown() or toHTML(fullDocument: true)
  |
  v
FileSystemAdapter.saveFileDialog(defaultName)
  |
  v
FileSystemAdapter.writeFile(path, content)
  |
  v
成功通知: 「{filename} を保存しました」
```

---

## 5. SettingsManager拡張 — プラットフォーム認証情報管理

### 5.1 認証情報の保存・取得

U1で実装済みのSettingsManagerを拡張し、プラットフォーム認証情報を管理する。

```
認証情報の保存先:
  |-- Tauri環境: SecureStorage (Stronghold) 経由
  |-- Web環境: localStorage（暗号化なし、開発用のみ）

キー構造:
  |-- platform.{platformId}.credentials → 認証情報
  |-- platform.{platformId}.connection → 接続状態
```

### 5.2 接続テスト

```
testConnection(platformId)
  |
  v
SettingsManager.getPlatformCredentials(platformId)
  |
  v
PlatformAdapterRegistry.get(platformId)
  |
  v
adapter.testConnection()
  |-- Zenn: GitHub API GET /repos/{owner}/{repo} を呼び出し
  |-- 成功: articles/ ディレクトリの存在確認
  |
  v
結果をUIに返却
  |-- 成功: 「接続成功: リポジトリ {owner}/{repo} に接続しました」
  |-- 失敗: 「接続失敗: {error_message}」
```
