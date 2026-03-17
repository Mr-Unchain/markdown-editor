# U1: Foundation - NFR Requirements

## パフォーマンス要件

### NFR-U1-01: 起動時間バジェット
- **全体目標**: アプリ起動から操作可能まで1秒以内
- **U1バジェット配分**:
  - Tauriウィンドウ表示: ~300ms（Tauri自体の起動）
  - FileSystemAdapter初期化（環境検出）: < 10ms
  - SettingsManager初期化（設定ファイル読み込み）: < 50ms
  - UIShell骨格レンダリング: < 100ms
  - **U1合計バジェット: < 460ms**（残り540msをU2-U4に配分）

### NFR-U1-02: 設定読み込み
- 設定ファイル読み込み・パース: < 50ms
- 設定変更のUI反映: 即時（Svelte Storeのリアクティブ更新）
- 設定ファイル書き込み（デバウンス後）: < 100ms

### NFR-U1-03: ファイルシステム操作
- ファイル読み込み（1MB以下）: < 100ms
- ファイル書き込み（1MB以下）: < 100ms
- ディレクトリ読み込み（100エントリ以下）: < 200ms

---

## 信頼性要件

### NFR-U1-04: 設定ファイル破損リカバリ
- 設定ファイルが破損（JSONパース失敗）: デフォルト設定で復元、ユーザーに通知
- 設定ファイルが存在しない: デフォルト設定で新規作成
- 部分的にスキーマ不一致: 有効なキーは保持、不足分はデフォルト値で補完

### NFR-U1-05: FileSystemAdapterエラーリトライ
- ファイルI/Oエラー: リトライなし（即座にエラーを返す）
- エラーはユーザーに通知（NotificationのToast表示）
- エラーによりアプリがクラッシュしない（全I/O操作をtry-catchでラップ）

### NFR-U1-06: Web版グレースフルデグラデーション
- File System Access API非対応ブラウザ: 起動時に非対応メッセージを表示、アプリは利用不可
- SecureStorage非対応: localStorage にフォールバック、警告メッセージ表示
- 対応ブラウザ: Chrome 86+, Edge 86+（Chromium系のみ）

---

## 保守性要件

### NFR-U1-07: コード品質
- TypeScript strict mode有効
- ESLint + Prettier でコードスタイル統一
- 各コンポーネントにユニットテスト（カバレッジ目標: 80%以上）

### NFR-U1-08: ログ出力
- 開発モード: console.log/warn/error で詳細ログ
- 本番モード: console.error のみ（パフォーマンスへの影響最小化）
- FileSystemAdapter操作: エラー時にパスとエラーコードをログ出力
