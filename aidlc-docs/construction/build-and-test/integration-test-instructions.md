# Integration Test Instructions

## Purpose
ユニット間の相互作用が正しく動作することを検証する。単体テストでは検出できない結合時の問題（初期化順序、型の不一致、イベント伝搬）を発見する。

## Existing Integration Test

### app-init.test.ts（既存）
- **対象**: `src/lib/__tests__/app-init.test.ts`
- **検証内容**: U1→U2→U3→U4 初期化シーケンス
- **実行**: `npx vitest run src/lib/__tests__/app-init.test.ts`

---

## Recommended Integration Test Scenarios

### Scenario 1: Full Publish Flow (U4 → U2 → U1)

**Description**: 記事投稿の全ステップがエンドツーエンドで動作することを検証

**Setup**:
```bash
# MockGitHubApiClient使用（実APIアクセスなし）
```

**Test Steps**:
1. `initializeApp()` でアプリケーション初期化
2. `PublishService.publish()` を呼び出し
3. パイプラインの7ステップが順次実行されることを確認:
   - validate → export → upload-images → replace-urls → publish → update-frontmatter → complete
4. `ProgressCallback` が各ステップで呼ばれることを確認
5. `PublishGuard` が二重実行を防止することを確認

**Expected Results**:
- PublishResult が成功ステータスで返却
- ProgressCallback が7回（各ステップで1回）呼ばれる
- frontmatter にpublish recordが書き込まれる

**File**: `src/lib/__tests__/publish-flow.integration.test.ts`（新規作成推奨）

---

### Scenario 2: Image Insertion Pipeline (U4 → U1)

**Description**: 画像挿入からワークスペース保存までのフローを検証

**Test Steps**:
1. `ImageManager.handleDrop()` で画像Blobを受け取り
2. `ImageValidator.validateImageBlob()` でMIME/サイズ検証
3. `ImageNaming.generateImageFilename()` でファイル名生成
4. `ImageManager.saveToWorkspace()` で`.assets/`ディレクトリに保存
5. Markdown参照`![](./filename.assets/image.png)`が返却される

**Expected Results**:
- `.assets/` ディレクトリが作成される（`fs.mkdir`）
- 画像ファイルが書き込まれる（`fs.writeBinaryFile`）
- 正しいMarkdown参照文字列が返却される

**File**: `src/lib/__tests__/image-insertion.integration.test.ts`（新規作成推奨）

---

### Scenario 3: Export Pipeline (U4 → U2)

**Description**: エディタHTMLからMarkdown/HTMLエクスポートの全フローを検証

**Test Steps**:
1. `ExportService.toHTML()` でHTML sanitization
2. `ExportService.toMarkdown()` でMarkdown変換
3. クリップボードAPI呼び出し確認
4. ファイルダウンロード（Blob生成）確認

**Expected Results**:
- DOMPurify sanitization が適用される
- 不正なタグが除去される
- 有効なMarkdown文字列が生成される

**File**: `src/lib/__tests__/export-flow.integration.test.ts`（新規作成推奨）

---

### Scenario 4: Platform Store ↔ Credential Manager (U4 → U1)

**Description**: プラットフォーム接続状態と資格情報管理の連携を検証

**Test Steps**:
1. `initPlatformStore(settingsManager)` で初期化
2. `loadConnections()` でZennデフォルト接続が登録される
3. `saveCredentials('zenn', {...})` でSecureStorageに保存
4. `hasCredentials('zenn')` が`true`を返す
5. `CredentialManager.withCredentials('zenn', fn)` で資格情報が取得・スコープ内で使用される
6. スコープ外では資格情報がGC対象になる

**Expected Results**:
- SecureStorage read/write が正しく呼ばれる
- JSON parse/stringifyが正しく動作
- withCredentials スコープ外でメモリ解放

**File**: `src/lib/__tests__/credential-flow.integration.test.ts`（新規作成推奨）

---

### Scenario 5: Slash Command → UI Event (U2 → U4)

**Description**: スラッシュコマンド実行がUI Custom Eventを発火することを検証

**Test Steps**:
1. `/publish` コマンドのaction関数を実行
2. `window.dispatchEvent(new CustomEvent('app:open-publish-dialog'))` が発火されることを確認
3. `/export` コマンドで `app:open-export-menu` イベント確認
4. `/image` コマンドで `app:insert-image` イベント確認

**Expected Results**:
- 各コマンドが正しいCustomEventを発火
- イベントリスナーで受信可能

**File**: `src/lib/__tests__/slash-command-events.integration.test.ts`（新規作成推奨）

---

## Run Integration Tests

### 1. Execute Integration Test Suite

```bash
# 既存
npx vitest run src/lib/__tests__/app-init.test.ts

# 新規作成後
npx vitest run src/lib/__tests__/*.integration.test.ts
```

### 2. Verify Service Interactions
- テストログでサービス間呼び出し順序を確認
- Mock呼び出し回数と引数を`expect().toHaveBeenCalledWith()`で検証

### 3. Cleanup
- テスト後のMock復元は`beforeEach`/`afterEach`で自動処理
- `vi.restoreAllMocks()` で全Mockをリセット
