# U4 Platform Integration — NFR Requirements プラン

## 概要
U4のNFR要件を評価し、Tech Stack決定を行う。API通信、画像アップロード、エクスポート処理のパフォーマンス・信頼性・セキュリティを中心に評価。

## 評価ステップ

### Step 1: パフォーマンス要件
- [ ] API通信レイテンシ目標（GitHub API呼び出し、投稿完了時間）
- [x] 画像アップロード速度目標（バッチアップロード、進捗更新頻度）
- [x] エクスポート処理速度目標（MD/HTML変換、クリップボードコピー）
- [x] UI応答性（ダイアログ表示速度、進捗表示の更新間隔）
- [x] 起動時間バジェット配分（U4分: 140ms以内 — U3 tech-stack-decisions.md準拠）

### Step 2: 信頼性要件
- [x] ネットワーク障害時の動作（オフライン検出、リトライ戦略）
- [x] 部分失敗リカバリ（画像アップロード一部失敗時の復旧）
- [x] データ損失防止（投稿途中でのクラッシュ対策）
- [x] 冪等性（同じ記事の重複投稿防止）

### Step 3: セキュリティ要件
- [x] 認証情報の保存方式（SecureStorage活用、平文保存禁止）
- [x] APIトークンの取り扱い（メモリ上の管理、ログ出力抑制）
- [x] ネットワーク通信のセキュリティ（HTTPS必須）
- [x] XSS防止（HTMLエクスポート時のサニタイズ）

### Step 4: ユーザビリティ要件
- [x] 進捗フィードバック（投稿・アップロード中の進捗表示）
- [x] エラーメッセージの質（ユーザーがアクション可能な情報提供）
- [x] アクセシビリティ（ダイアログ、フォーム、通知のARIA対応）

### Step 5: 保守性要件
- [x] PlatformAdapterの拡張性（Post-MVP向けnote/microCMS/Contentful追加容易性）
- [x] テスタビリティ（外部API依存のテスト戦略）

### Step 6: Tech Stack決定
- [x] GitHub API クライアント選定（自前fetchラッパー）
- [x] 画像処理ライブラリ選定（MVPでは不実装）
- [x] Markdown→HTML変換ライブラリ確認（Tiptap内蔵）
- [x] クリップボードAPI確認（Web Clipboard API）
- [x] frontmatterパーサー選定（gray-matter + js-yaml 4.x）

### Step 7: 成果物生成
- [x] nfr-requirements.md 生成（21要件）
- [x] tech-stack-decisions.md 生成（3パッケージ追加 ~39KB）
- [x] セルフレビュー実施（CRITICAL 2件、HIGH 5件修正済み）

---

## 質問ファイル
`aidlc-docs/construction/plans/u4-nfr-requirements-questions.md` を参照してください。
