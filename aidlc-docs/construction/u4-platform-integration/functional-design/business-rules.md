# U4 Platform Integration — ビジネスルール

## ルール一覧

| ID | カテゴリ | ルール名 | 重要度 |
|---|---|---|---|
| BR-U4-01 | 投稿バリデーション | タイトル必須 | MUST |
| BR-U4-02 | 投稿バリデーション | 本文空チェック | MUST |
| BR-U4-03 | 投稿バリデーション | 接続確認必須 | MUST |
| BR-U4-04 | 投稿バリデーション | Zennトピック制限 | MUST |
| BR-U4-05 | 投稿バリデーション | Zenn slug形式 | MUST |
| BR-U4-06 | 画像バリデーション | 許可MIMEタイプ | MUST |
| BR-U4-07 | 画像バリデーション | ファイルサイズ上限 | MUST |
| BR-U4-08 | 画像バリデーション | ファイル名生成 | MUST |
| BR-U4-09 | 画像管理 | assetsフォルダ自動作成 | MUST |
| BR-U4-10 | 画像管理 | assetsフォルダ連動 | SHOULD |
| BR-U4-11 | 認証 | トークン保存方式 | MUST |
| BR-U4-12 | 認証 | 接続テスト必須 | SHOULD |
| BR-U4-13 | エクスポート | 画像パス変換 | MUST |
| BR-U4-14 | エクスポート | frontmatter保持 | MUST |
| BR-U4-15 | 投稿フロー | 更新時確認 | MUST |
| BR-U4-16 | 投稿フロー | 部分失敗リカバリ | MUST |
| BR-U4-17 | 投稿フロー | frontmatter更新 | MUST |
| BR-U4-18 | エクスポート | コピー成功通知 | MUST |

---

## 投稿バリデーションルール

### BR-U4-01: タイトル必須
- **条件**: プラットフォーム投稿時
- **ルール**: タイトルが空文字列または未入力の場合、投稿を拒否する
- **エラーメッセージ**: 「タイトルを入力してください」
- **適用タイミング**: PublishService.publish() のStep 1 VALIDATE

### BR-U4-02: 本文空チェック
- **条件**: プラットフォーム投稿時
- **ルール**: エディター本文が空（空白・改行のみ含む）の場合、投稿を拒否する
- **エラーメッセージ**: 「記事の本文を入力してください」
- **適用タイミング**: PublishService.publish() のStep 1 VALIDATE

### BR-U4-03: 接続確認必須
- **条件**: プラットフォーム投稿時
- **ルール**: 対象プラットフォームの isConnected が false の場合、投稿を拒否する
- **エラーメッセージ**: 「{プラットフォーム名}に接続されていません。設定画面から接続してください」
- **適用タイミング**: PublishService.publish() のStep 1 VALIDATE

### BR-U4-04: Zennトピック制限
- **条件**: Zenn投稿時
- **ルール**: topics は1〜5個の範囲。各topicは小文字英数字とハイフンのみ（`/^[a-z0-9-]+$/`）
- **エラーメッセージ**: 「トピックは1〜5個指定してください」/「トピックは小文字英数字とハイフンのみ使用できます」
- **適用タイミング**: 投稿ダイアログのフォームバリデーション

### BR-U4-05: Zenn slug形式
- **条件**: Zenn投稿時
- **ルール**: slugは12〜50文字、小文字英数字とハイフンのみ（`/^[a-z0-9-]{12,50}$/`）。未指定の場合はランダム生成（12文字）
- **自動生成**: `crypto.randomUUID().replace(/-/g, '').slice(0, 12)`
- **適用タイミング**: ZennAdapter.publishDraft() 内

---

## 画像バリデーションルール

### BR-U4-06: 許可MIMEタイプ
- **条件**: 画像挿入時（D&D、ペースト、ファイル選択）
- **ルール**: 以下のMIMEタイプのみ受け入れる
  - `image/png`
  - `image/jpeg`
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`
- **エラーメッセージ**: 「対応していない画像形式です。PNG, JPEG, GIF, WebP, SVGを使用してください」
- **適用タイミング**: ImageManager.handleDrop/handlePaste/insertFromFile()

### BR-U4-07: ファイルサイズ上限
- **条件**: 画像挿入時
- **ルール**: 1ファイルあたり5MB以下
- **エラーメッセージ**: 「画像ファイルが大きすぎます（{size}MB）。5MB以下のファイルを使用してください」
- **適用タイミング**: ImageManager バリデーション段階

### BR-U4-08: ファイル名生成
- **条件**: 画像保存時
- **ルール**: `{元ファイル名（拡張子除去、sanitize済み）}-{YYYYMMDDHHmmss}.{拡張子}`
  - sanitize: 英数字、ハイフン、アンダースコア以外を除去
  - 元ファイル名が空の場合: `image-{YYYYMMDDHHmmss}.{拡張子}`
  - 衝突時: `-001`, `-002` を末尾に付加
- **適用タイミング**: ImageManager.saveToWorkspace()

---

## 画像管理ルール

### BR-U4-09: assetsフォルダ自動作成
- **条件**: 画像挿入時、対象MDファイルのassetsフォルダが存在しない場合
- **ルール**: `{MDファイル名}.assets/` フォルダを自動作成する
- **適用タイミング**: ImageManager.saveToWorkspace()

### BR-U4-10: assetsフォルダ連動
- **条件**: MDファイルのリネーム/削除時
- **ルール**:
  - リネーム: `old-name.assets/` → `new-name.assets/` にリネーム。Markdown内の画像パスも更新
  - 削除: 「関連する画像フォルダ（{name}.assets/）も削除しますか？」確認ダイアログを表示
- **適用タイミング**: FileManager.renameFile() / FileManager.deleteFile() からの連携

---

## 認証ルール

### BR-U4-11: トークン保存方式
- **条件**: プラットフォーム認証情報の保存時
- **ルール**:
  - Tauri環境: SecureStorage（Stronghold）に保存。平文でのファイル保存は禁止
  - Web環境: localStorage に保存（開発用のみ。本番では警告表示）
- **適用タイミング**: SettingsManager.setPlatformCredentials()

### BR-U4-12: 接続テスト必須
- **条件**: 認証情報の保存後
- **ルール**: 認証情報保存後、自動的に接続テストを実行する。テスト失敗でも保存はする（後で修正可能）
- **適用タイミング**: 接続設定画面の保存ボタン押下後

---

## エクスポートルール

### BR-U4-13: 画像パス変換
- **条件**: エクスポート時
- **ルール**:
  - Markdownエクスポート: ローカル相対パスのまま変換なし
  - HTMLエクスポート: ローカル画像をBase64データURLに変換（`data:image/png;base64,...`）
  - プラットフォーム投稿: アップロード後のリモートURLに置換
- **適用タイミング**: ExportService.toMarkdown() / toHTML() / toPlatformFormat()

### BR-U4-14: frontmatter保持
- **条件**: Markdownエクスポート時
- **ルール**: 既存のfrontmatter（---で囲まれたYAMLブロック）はそのまま保持する
- **適用タイミング**: ExportService.toMarkdown()

### BR-U4-19: supportsDirectPublish による投稿ボタン制御
- **条件**: 投稿ダイアログ表示時
- **ルール**: 選択プラットフォームの `supportsDirectPublish` が false の場合、「投稿」ボタンを非活性にし、エクスポートのみ可能とする。ツールチップに「このプラットフォームはAPI投稿に対応していません。エクスポート機能をご利用ください」を表示
- **適用タイミング**: PublishDialog のプラットフォーム選択変更時

---

### BR-U4-18: コピー成功通知
- **条件**: クリップボードコピー完了時
- **ルール**: トースト通知を表示する。「{format}としてコピーしました」（3秒後に自動消去）
- **適用タイミング**: PublishService.exportToClipboard()

---

## 投稿フロールール

### BR-U4-15: 更新時確認
- **条件**: 既存記事の更新（frontmatterにpublish_recordsが存在する場合）
- **ルール**: 確認ダイアログを表示する
  - 「この記事は {platformName} に投稿済みです（{publishedAt}）。上書き更新しますか？」
  - 選択肢: [更新する] / [新規として投稿] / [キャンセル]
- **適用タイミング**: PublishService.publish() のStep 5 PUBLISH前

### BR-U4-16: 部分失敗リカバリ
- **条件**: 画像アップロードが一部失敗した場合
- **ルール**:
  - 成功した画像のURL置換は保持する
  - 失敗した画像はローカルパスのまま残す
  - リトライダイアログを表示: 「{n}件中{m}件の画像アップロードに失敗しました。再試行しますか？」
  - [再試行]: 失敗した画像のみ再アップロード
  - [このまま投稿]: 失敗画像はローカルパスのまま投稿
  - [キャンセル]: 投稿中止
- **適用タイミング**: PublishService.publish() のStep 3 UPLOAD-IMAGES後

### BR-U4-17: frontmatter更新
- **条件**: 投稿成功後
- **ルール**: 記事ファイルのfrontmatterにPublishRecordを追記/更新する
  - 同一プラットフォームの既存レコードがあれば更新
  - なければ新規追加
  - `updatedAt` を現在日時に設定
- **適用タイミング**: PublishService.publish() のStep 6 UPDATE-FRONTMATTER
