# U4 Platform Integration — NFR Requirements

## NFR要件一覧

| ID | カテゴリ | 要件名 | 優先度 |
|---|---|---|---|
| NFR-U4-01 | パフォーマンス | エクスポート処理速度 | MUST |
| NFR-U4-02 | パフォーマンス | 画像挿入応答性 | MUST |
| NFR-U4-03 | パフォーマンス | UI応答性（ダイアログ） | MUST |
| NFR-U4-04 | パフォーマンス | 起動時間バジェット | MUST |
| NFR-U4-05 | パフォーマンス | 投稿進捗フィードバック | MUST |
| NFR-U4-06 | 信頼性 | オフラインエクスポート | MUST |
| NFR-U4-07 | 信頼性 | ネットワーク障害検出 | MUST |
| NFR-U4-08 | 信頼性 | 部分失敗リカバリ | MUST |
| NFR-U4-09 | 信頼性 | 投稿冪等性 | SHOULD |
| NFR-U4-10 | セキュリティ | 認証情報保護 | MUST |
| NFR-U4-11 | セキュリティ | HTMLサニタイズ | MUST |
| NFR-U4-12 | セキュリティ | HTTPS通信必須 | MUST |
| NFR-U4-13 | セキュリティ | ログ出力抑制 | MUST |
| NFR-U4-14 | ユーザビリティ | エラーメッセージ品質 | MUST |
| NFR-U4-15 | ユーザビリティ | アクセシビリティ | MUST |
| NFR-U4-16 | 保守性 | アダプター拡張性 | MUST |
| NFR-U4-17 | 保守性 | テスタビリティ | MUST |
| NFR-U4-18 | パフォーマンス | GitHub APIレート制限バジェット | MUST |
| NFR-U4-19 | パフォーマンス | バンドルサイズバジェット | MUST |
| NFR-U4-20 | 信頼性 | 投稿パイプラインタイムアウト | MUST |
| NFR-U4-21 | ユーザビリティ | 通知トーストタイミング | MUST |

---

## パフォーマンス要件

### NFR-U4-01: エクスポート処理速度
- **要件**: Markdown/HTMLエクスポート（変換+クリップボードコピー）は500ms以内に完了する
- **計測**: エクスポートボタン押下 → クリップボード書き込み完了 or ファイル保存完了
- **対象**: 標準的な記事（5,000文字、画像10枚参照）
- **HTMLエクスポート**: Base64画像埋め込みを含む場合は画像読み込み時間を除外し、変換処理のみ500ms
- **根拠**: ユーザーが「コピーした」と感じるまでの体感時間。エクスポートはローカル処理のみ

### NFR-U4-02: 画像挿入応答性
- **要件**: 画像D&D/ペーストから、エディターへのプレビュー表示まで300ms以内（1MB以下の画像）
- **内訳**: ファイル読み取り(50ms) + ファイル名生成(1ms) + ローカル保存(50ms) + Markdown挿入(50ms) + レンダリング(100ms) = 251ms（バッファ49ms）
- **大画像（1MB〜5MB）**: 800ms以内を目標（ローカル保存に追加時間が必要）
- **根拠**: 画像挿入は頻繁な操作であり、即座のフィードバックが重要

### NFR-U4-03: UI応答性（ダイアログ）
- **要件**: 投稿ダイアログ/設定ダイアログの表示は200ms以内
- **内訳**: frontmatter読み込み(50ms) + Store初期化(50ms) + DOM描画(100ms)
- **根拠**: U2 NFR-U2-01（ツールバー応答100ms）に準拠したUI応答性

### NFR-U4-04: 起動時間バジェット
- **要件**: U4初期化処理は140ms以内（全体1,000msバジェットのうち）
- **内訳**: PlatformAdapterRegistry初期化(30ms) + 接続状態読み込み(50ms) + ExportService初期化(10ms) + ImageManager初期化(10ms) + PublishService初期化(10ms) + スラッシュコマンド登録(30ms)
- **戦略**: 認証トークンの有効性チェックは起動後に非同期で実行（起動クリティカルパスに含めない）
- **根拠**: U3 tech-stack-decisions.md の起動バジェット配分に準拠

### NFR-U4-05: 投稿進捗フィードバック
- **要件**: 投稿操作中は200ms以内の間隔で進捗UIを更新する
- **内訳**: ステップ遷移時に即座にUI更新。画像アップロード中は各画像完了ごとに進捗バー更新
- **根拠**: ユーザーが「フリーズしていない」と認識できる更新頻度

---

## 信頼性要件

### NFR-U4-06: オフラインエクスポート
- **要件**: エクスポート機能（Markdownコピー、HTMLコピー、ファイルダウンロード）はネットワーク接続がなくても完全に動作する
- **理由**: エクスポートはローカルのProseMirror Doc変換のみで外部依存がないため、オフラインで動作しない理由がない
- **例外**: プラットフォーム投稿（PublishService.publish()）はオンライン必須。オフライン時は投稿ボタンを非活性にし「オフラインです。投稿にはインターネット接続が必要です」を表示

### NFR-U4-07: ネットワーク障害検出
- **要件**: API呼び出し前にネットワーク接続状態を確認する。オフライン検出時は即座にユーザーに通知する
- **実装方針**:
  - `navigator.onLine` で初期判定
  - fetch失敗時のエラーハンドリングで実際の接続不可を検出
  - 投稿操作開始前にプリフライトチェック（GitHub API GET /rate_limit でヘルスチェック）
- **タイムアウト**: API呼び出しのタイムアウトは15秒（個別リクエスト単位）

### NFR-U4-08: 部分失敗リカバリ
- **要件**: 画像アップロードの一部失敗時、成功分のURL置換は保持し、失敗分のみ再試行可能にする
- **詳細**:
  - 成功した画像のリモートURLは記録し、再投稿時にスキップ
  - 失敗画像リストをPublishProgress.imageProgress.failedFilesに保持
  - リトライ時は失敗画像のみ対象
- **データ損失防止**: 投稿パイプラインのどのステップで失敗しても、元のエディター内容は変更しない（URL置換は投稿用コピーに対して行う）

### NFR-U4-09: 投稿冪等性
- **要件**: 同じ記事の重複投稿を防止する
- **実装方針**:
  - frontmatterのPublishRecordでarticleId/slugを追跡
  - 同一slugの記事が既に存在する場合、「更新」として扱う（BR-U4-15の確認ダイアログ）
  - 投稿中フラグ（isPublishing）で二重送信を防止

---

## セキュリティ要件

### NFR-U4-10: 認証情報保護
- **要件**: プラットフォーム認証情報（GitHub Token等）は必ずSecureStorage（Stronghold）に保存する。平文でのファイル保存は禁止
- **詳細**:
  - Tauri環境: `@tauri-apps/plugin-stronghold` 経由で暗号化保存（U1 SecureStorageを使用）
  - Web環境: `localStorage` に保存（開発・デモ用のみ。「認証情報はブラウザのlocalStorageに保存されます。本番利用にはデスクトップアプリをお使いください」と警告表示）
  - メモリ上: 使用後に参照をnullにする（GC任せ。明示的ゼロ化はJSでは不可能だが、保持時間を最小化）

### NFR-U4-11: HTMLサニタイズ
- **要件**: HTMLエクスポート時はDOMPurifyでサニタイズする
- **理由**: TiptapのHTML出力は通常安全だが、カスタムHTML入力やプラグイン経由で不正なHTMLが混入する可能性を排除
- **設定**: `DOMPurify.sanitize(html, { ALLOWED_TAGS: [...], ALLOWED_ATTR: [...] })`
  - 許可タグ: 標準的なMarkdown由来のHTML要素（p, h1-h6, ul, ol, li, table, thead, tbody, tr, td, th, code, pre, blockquote, a, img, em, strong, del, hr, br, input[checkbox], div, span, figure, figcaption）
  - **div/span**: Tiptapの出力に含まれる（コードブロックラッパー等）。class/id属性のみ許可（style属性は禁止）
  - **figure/figcaption**: 画像キャプション用
  - 許可属性: href, src, alt, title, class, id, type, checked, align
  - 禁止: script, iframe, object, embed, form, on* イベントハンドラ

### NFR-U4-12: HTTPS通信必須
- **要件**: 全ての外部API通信はHTTPS経由で行う。HTTP通信は許可しない
- **実装**: fetch呼び出し時にURLスキームを検証。`https://` 以外はリジェクト
- **対象**: GitHub API（api.github.com）、将来のnote/microCMS/Contentful API

### NFR-U4-13: ログ出力抑制
- **要件**: 認証情報（トークン、APIキー）をconsole.log/errorやエラーレポートに含めない
- **実装**:
  - APIリクエストログ: URLのみ出力、Authorizationヘッダーはマスク
  - エラーメッセージ: サーバーレスポンスのbodyは出力可（トークンは含まれないため）
  - 開発モードでもトークン値をログ出力しない

---

## ユーザビリティ要件

### NFR-U4-14: エラーメッセージ品質
- **要件**: エラーメッセージは (1) 何が起きたか (2) なぜ起きたか (3) どうすればいいか の3要素を含む
- **例**:
  - 良い: 「Zennへの投稿に失敗しました。GitHub Tokenの有効期限が切れている可能性があります。設定画面からトークンを更新してください。」
  - 悪い: 「Error: 401 Unauthorized」
- **実装**: PlatformAdapter各メソッドのcatchブロックで、HTTPステータスコードをユーザーフレンドリーなメッセージに変換

### NFR-U4-15: アクセシビリティ
- **要件**: WCAG 2.1 AAA準拠（U1/U2/U3 NFR準拠）
- **詳細**:
  - PublishDialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - PlatformSettingsDialog: 同上
  - ExportMenu: `role="menu"`, `role="menuitem"`, キーボードナビゲーション（↑↓Enter Escape）
  - NotificationToast: `role="alert"`, `aria-live="polite"`（success/info）, `aria-live="assertive"`（error）
  - フォーム: 全入力フィールドに`<label>`または`aria-label`を付与
  - フォーカストラップ: モーダルダイアログ内でTabキーがループする
  - ImageDropOverlay: `aria-label="画像をドロップして挿入"`

---

## 保守性要件

### NFR-U4-16: アダプター拡張性
- **要件**: 新しいプラットフォーム（note, microCMS, Contentful）の追加が、PlatformAdapterインターフェースの実装とPlatformAdapterRegistryへの登録のみで完了する
- **詳細**:
  - PublishService, ImageManager, ExportService, UIコンポーネントの変更は不要
  - 新アダプターはPlatformAdapterインターフェースを実装するだけ
  - PlatformSettingsDialogは接続カードを動的生成（platforms配列をループ）
  - PublishDialogのプラットフォーム選択はPlatformAdapterRegistry.getAll()から動的取得

### NFR-U4-17: テスタビリティ
- **要件**: 外部API依存のコードは全てモック可能な設計とする
- **テスト戦略**:
  - **ユニットテスト（Vitest）**: GitHub APIクライアントをモック。PlatformAdapter, PublishService, ImageManager, ExportServiceの各メソッドをテスト
  - **契約テスト**: GitHub Contents APIのレスポンススキーマを定義し、モックがスキーマに準拠しているか検証（テスト内でスキーマバリデーション）
  - **統合テスト**: PlatformAdapter → PublishService → ExportService の連携をモックAPI付きでテスト
  - **E2Eテスト（将来）**: テスト用GitHubリポジトリを使用した実APIテスト（CI/CD環境でのみ実行）
- **モック設計**: `GitHubApiClient` インターフェースを定義し、本番実装とモック実装を差し替え可能にする
- **テストカバレッジ目標**: ≥80%（PublishService, ImageManager, ExportService, ZennAdapter, GitHubApiClientのビジネスロジック。U1/U2/U3と同一基準）
- **テスト環境**: DOMPurifyを使用するモジュールはVitest環境を`jsdom`に設定する

---

## 追加NFR要件

### NFR-U4-18: GitHub APIレート制限バジェット
- **要件**: 単一投稿操作のGitHub API呼び出しは最大30リクエスト以内とする
- **内訳**: 画像アップロード（各画像1 PUT、SHA取得時+1 GET）+ 記事ファイル1 PUT + テスト1 GET = 画像N枚の場合 最大 2N+2 リクエスト
- **上限**: 画像14枚で30リクエストに到達（2×14+2=30）。15枚以上の場合は投稿前に警告表示
- **根拠**: GitHubセカンダリレート制限（100リクエスト/10分バースト）を回避

### NFR-U4-19: バンドルサイズバジェット
- **要件**: U4の追加パッケージのバンドルサイズは50KB以下（minified, gzip前）
- **現状**: gray-matter ~12KB + js-yaml 4.x ~7KB + DOMPurify ~20KB = ~39KB
- **残りバジェット**: 11KB
- **根拠**: アプリ全体の軽量性維持（U1 NFR起動速度要件との整合）

### NFR-U4-20: 投稿パイプラインタイムアウト
- **要件**: 投稿パイプライン全体のタイムアウトは300秒（5分）。超過時はキャンセル可能なエラーダイアログを表示
- **個別リクエストタイムアウト**: 15秒（NFR-U4-07）
- **根拠**: 大量画像アップロードでも妥当な上限を設定

### NFR-U4-21: 通知トーストタイミング
- **要件**: success/info = 3秒自動消去、warning = 5秒自動消去、error = 手動消去のみ
- **根拠**: ユーザーが結果を認識できる表示時間。エラーは見逃し防止のため手動消去
