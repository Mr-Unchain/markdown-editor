# Unit Test Execution

## Test Framework
- **Framework**: Vitest 2.x
- **Environment**: jsdom
- **Setup**: `src/test-setup.ts`（`@testing-library/jest-dom/vitest`）
- **Component Testing**: `@testing-library/svelte` 5.x

## Run Unit Tests

### 1. Execute All Unit Tests

```bash
cd markdown-editor/markdown-editor
npm run test:run
```

### 2. Execute with Coverage

```bash
npm run test:coverage
```

### 3. Execute Specific Unit Tests

```bash
# U1 Foundation
npx vitest run src/lib/infrastructure/ src/lib/core/settings/

# U2 Core Editor
npx vitest run src/lib/core/editor/ src/components/editor/

# U3 File Management
npx vitest run src/lib/core/file-manager/ src/lib/services/__tests__/workspace-service.test.ts src/lib/utils/__tests__/ src/components/sidebar/ src/components/tabs/ src/components/dialogs/__tests__/NewFileDialog.test.ts src/components/dialogs/__tests__/RecoveryDialog.test.ts

# U4 Platform Integration
npx vitest run src/lib/integration/ src/lib/services/__tests__/credential-manager.test.ts src/lib/services/__tests__/publish-pipeline.test.ts src/lib/services/__tests__/publish-service.test.ts src/lib/stores/__tests__/publish-store.test.ts src/lib/stores/__tests__/platform-store.test.ts src/lib/stores/__tests__/image-store.test.ts src/lib/core/image-manager/ src/components/__tests__/ src/lib/utils/__tests__/network-status.test.ts src/lib/utils/__tests__/error-messages.test.ts
```

## Review Test Results

### Expected Results

| ユニット | テストファイル数 | 期待結果 |
|---|---|---|
| U1 Foundation | 9 | 全パス |
| U2 Core Editor | 8 | 全パス |
| U3 File Management | 19 | 全パス |
| U4 Platform Integration | 22 | 全パス |
| Cross-Unit | 1 | 全パス |
| **合計** | **60** | **全パス、0 failures** |

### Test Coverage Targets

| カテゴリ | 目標 |
|---|---|
| Statements | ≥ 80% |
| Branches | ≥ 75% |
| Functions | ≥ 80% |
| Lines | ≥ 80% |

### Test Report Location
- **Console出力**: テスト結果サマリー
- **Coverage**: `coverage/` ディレクトリ（HTML/LCOV）

## Fix Failing Tests

テスト失敗時の対応:

1. **失敗テストの特定**: コンソール出力でFAILED行を確認
2. **エラー内容の分析**:
   - `TypeError: xxx is not a function` → メソッド名の不一致（例: `createDirectory` vs `mkdir`）
   - `$state is not defined` → `.svelte.ts`ファイルでないのに`$state`使用
   - `Cannot find module` → import pathの解決失敗
3. **修正・再実行**: `npx vitest run [failing-test-file]`

## U4 固有テスト注意事項

### Mock パターン
- **GitHubApiClient**: `MockGitHubApiClient`（テスト専用実装）を使用
- **FileSystemAdapter**: `vi.fn()` mockで各メソッドをスタブ
- **SettingsManager**: `vi.fn()` mockで`get`/`getPlatformCredentials`をスタブ
- **SecureStorage**: `vi.fn()` mockで`get`/`set`/`has`をスタブ

### Contract Tests（zod スキーマ）
- `github-api-schemas.ts` のzodスキーマでGitHub API応答構造を検証
- MockGitHubApiClientの応答がスキーマに適合することを確認

### 非同期テスト
- `PublishPipeline`: AbortController/signalのキャンセルテスト含む
- `CredentialManager`: withCredentials スコープ管理テスト
- `NetworkStatus`: online/offline イベントリスナーテスト
