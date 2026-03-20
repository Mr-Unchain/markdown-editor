# U2: Core Editor — NFR Requirements Plan

## 対象ユニット
U2: Core Editor（WYSIWYGマークダウン編集エンジン）

## 前提
- U1 NFR Requirements / Tech Stack Decisions を継承
- U2 Functional Design成果物を分析済み

## ステップ

### Part 1: 質問収集
- [x] Step 1: Functional Design成果物の分析（ビジネスロジック複雑度の把握）
- [x] Step 2: context7でTiptap v2/lowlightの性能特性を確認
- [x] Step 3: NFR質問ファイルの作成
- [ ] Step 4: ユーザー回答の収集と曖昧さ分析

### Part 2: 成果物生成
- [ ] Step 5: NFR Requirements（nfr-requirements.md）作成
  - パフォーマンス要件（入力遅延、レンダリング、大規模ドキュメント）
  - 信頼性要件（エクステンションエラー、データ保全）
  - ユーザビリティ要件（アクセシビリティ、レスポンシブ）
  - **context7検証**: Tiptap のパフォーマンスベストプラクティス確認
- [ ] Step 6: Tech Stack Decisions（tech-stack-decisions.md）作成
  - Tiptap + エクステンション選定
  - lowlight + highlight.js バンドル戦略
  - 同梱プラグイン実装方式
  - **context7検証**: 各パッケージの最新バージョン・互換性確認
- [ ] Step 7: プラン内チェックボックス更新 + aidlc-state.md更新
- [ ] Step 8: 完了メッセージの提示・ユーザー承認待ち
