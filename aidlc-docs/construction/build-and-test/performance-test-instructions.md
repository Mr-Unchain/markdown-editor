# Performance Test Instructions

## Purpose
NFRで定義されたパフォーマンス目標を達成していることを計測・検証する。

## Performance Requirements Summary

### Startup Budget (合計 ≤ 1,000ms)

| ユニット | バジェット | 対象NFR |
|---|---|---|
| U1 Foundation | ≤ 460ms | NFR-U1-01 |
| U2 Core Editor | ≤ 200ms | NFR-U2-02 |
| U3 File Management | ≤ 200ms | NFR-U3-04 |
| U4 Platform Integration | ≤ 140ms | NFR-U4-04 |
| **合計** | **≤ 1,000ms** | |

### Operation Latency Targets

| 操作 | 目標 | NFR |
|---|---|---|
| テキスト入力遅延 | ≤ 50ms (200KBドキュメント) | NFR-U2-01 |
| スラッシュコマンド表示 | ≤ 50ms | NFR-U2-04 |
| Markdown変換 | ≤ 100-200ms | NFR-U2-06 |
| ファイルツリー表示(100項目) | ≤ 100ms | NFR-U3-01 |
| タブ切替 | ≤ 100ms | NFR-U3-03 |
| エクスポート(MD/HTML) | ≤ 500ms | NFR-U4-01 |
| 画像挿入 | ≤ 300ms (通常) / ≤ 800ms (大画像) | NFR-U4-02 |
| ダイアログ表示 | ≤ 200ms | NFR-U4-03 |
| 進捗UI更新間隔 | ≤ 200ms | NFR-U4-05 |

### Resource Limits

| リソース | 制限 | NFR |
|---|---|---|
| GitHub APIリクエスト/投稿 | ≤ 30 | NFR-U4-18 |
| パイプラインタイムアウト | 300s | NFR-U4-20 |
| 画像サイズ上限 | 5MB | NFR-U4-02 |
| 画像数警告閾値 | 14 | NFR-U4-18 |

---

## Performance Test Setup

### 1. Prepare Test Environment

```bash
cd markdown-editor/markdown-editor
npm install
```

**環境要件**:
- Node.js >= 18.x
- 安定したネットワーク接続（パフォーマンス計測のブレを最小化）
- 他のCPU集約プロセスを停止

### 2. Performance Test Approach

Vitestの`performance.now()`を使用した計測:

```typescript
// パフォーマンス計測パターン
it('should complete within NFR budget', async () => {
  const start = performance.now()
  await targetOperation()
  const elapsed = performance.now() - start
  expect(elapsed).toBeLessThan(TARGET_MS)
})
```

---

## Recommended Performance Tests

### Test 1: Startup Time Measurement

**File**: `src/__tests__/performance/startup.perf.test.ts`（新規作成推奨）

```typescript
describe('Startup Performance', () => {
  it('U4 initializePlatformIntegration ≤ 140ms', async () => {
    const start = performance.now()
    await initializePlatformIntegration(mockFs, mockSettingsManager)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(140)
  })
})
```

### Test 2: Export Latency

**File**: `src/__tests__/performance/export.perf.test.ts`（新規作成推奨）

- `ExportService.toHTML()` ≤ 500ms（10KB HTML入力）
- `ExportService.toMarkdown()` ≤ 500ms（10KB HTML入力）
- クリップボードコピー ≤ 200ms

### Test 3: Image Processing Latency

**File**: `src/__tests__/performance/image.perf.test.ts`（新規作成推奨）

- `ImageValidator.validateImageBlob()` ≤ 10ms
- `ImageManager.saveToWorkspace()` ≤ 300ms (1MB画像)
- `ImageManager.collectLocalImages()` ≤ 100ms (20ファイル)

### Test 4: Publish Pipeline Request Budget

**File**: `src/__tests__/performance/publish.perf.test.ts`（新規作成推奨）

- 画像なし投稿: APIリクエスト ≤ 5回
- 画像5枚投稿: APIリクエスト ≤ 15回
- 画像14枚投稿: APIリクエスト ≤ 30回（上限）
- パイプラインタイムアウト: 300s超過で自動キャンセル

---

## Run Performance Tests

```bash
# 新規作成後
npx vitest run src/__tests__/performance/
```

## Analyze Results

### 合格基準
- 全テストがNFR目標値以内
- 3回実行の中央値で判定（外れ値除外）

### 不合格時の対応
1. `performance.now()` の計測結果でボトルネック特定
2. 遅延箇所のプロファイリング（Chrome DevTools Performance tab）
3. 最適化実施後、再テスト

### 既知のパフォーマンス最適化ポイント
- **DOMPurify/gray-matter**: 遅延importで初回起動への影響を回避
- **接続テスト**: `queueMicrotask`でバックグラウンド実行
- **画像バリデーション**: Blob.type（インメモリ、I/O不要）
