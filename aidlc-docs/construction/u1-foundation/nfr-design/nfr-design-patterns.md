# U1: Foundation - NFR Design Patterns

## パフォーマンスパターン

### P1: 遅延初期化（Lazy Initialization）
**対象**: FileSystemAdapter, SecureStorage
**目的**: 起動時間を最小化（NFR-U1-01: U1 < 460ms）

```
アプリ起動
    |
    v
[即時] 環境検出 → FileSystemAdapterインスタンス生成（<10ms）
    |
    v
[即時] SettingsManager.initialize() → 設定読み込み（<50ms）
    |
    v
[即時] UIShell骨格レンダリング（<100ms）
    |
    v
[遅延] SecureStorage → 初回アクセス時に初期化
[遅延] プラットフォーム接続テスト → バックグラウンドで実行
```

**実装方針**:
- FileSystemAdapterは環境検出のみ同期実行、ファイルI/Oは非同期
- SecureStorageはStronghold初期化が重い可能性があるため、認証情報の初回アクセス時まで遅延
- プラットフォーム接続状態はUIレンダリング後にバックグラウンドチェック

### P2: デバウンス書き込み（Debounced Write）
**対象**: SettingsManager
**目的**: 頻繁な設定変更時のI/O負荷軽減

```typescript
// 実装パターン
class SettingsManager {
  private writeTimer: ReturnType<typeof setTimeout> | null = null
  private readonly DEBOUNCE_MS = 500

  async set<T>(key: string, value: T): Promise<void> {
    // 1. Svelte Storeを即時更新（UIに即反映）
    this.store.update(s => ({ ...s, [key]: value }))

    // 2. ファイル書き込みをデバウンス
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => this.flush(), this.DEBOUNCE_MS)
  }

  async flush(): Promise<void> {
    // 現在の設定をファイルに書き込み
    const settings = get(this.store)
    await this.fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2))
  }

  // アプリ終了時にフラッシュ
  async onAppClose(): Promise<void> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      await this.flush()
    }
  }
}
```

---

## 信頼性パターン

### R1: セーフラッパー（Safe Wrapper）
**対象**: FileSystemAdapter の全操作
**目的**: I/Oエラーによるアプリクラッシュ防止（NFR-U1-05）

```typescript
// 全てのFileSystemAdapter操作をResult型でラップ
type Result<T> = { ok: true; value: T } | { ok: false; error: FileSystemError }

// ユーティリティ関数
async function safeCall<T>(fn: () => Promise<T>, path?: string): Promise<Result<T>> {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (e) {
    const error = toFileSystemError(e, path)
    console.error(`[FS] ${error.code}: ${error.message}`, error.path)
    return { ok: false, error }
  }
}
```

**適用**: FileSystemAdapterの全publicメソッドでResult型を返す

### R2: デフォルトフォールバック（Default Fallback）
**対象**: SettingsManager
**目的**: 設定ファイル破損時のリカバリ（NFR-U1-04）

```
設定ファイル読み込み
    |
    v
JSONパース成功？
    |
    +-- Yes --> スキーマバリデーション
    |              |
    |              +-- 完全一致 --> そのまま使用
    |              +-- 部分一致 --> デフォルトとマージ（既存キー保持）
    |
    +-- No  --> デフォルト設定で上書き + ユーザー通知
```

```typescript
function loadSettings(raw: string): AppSettings {
  try {
    const parsed = JSON.parse(raw)
    return mergeWithDefaults(parsed, DEFAULT_SETTINGS)
  } catch {
    notify('warning', '設定ファイルが破損していたため、デフォルト設定で復元しました。')
    return { ...DEFAULT_SETTINGS }
  }
}

function mergeWithDefaults(partial: Partial<AppSettings>, defaults: AppSettings): AppSettings {
  return {
    ...defaults,
    ...partial,
    editor: { ...defaults.editor, ...partial.editor },
    plugins: { ...defaults.plugins, ...partial.plugins },
    platforms: { ...defaults.platforms, ...partial.platforms },
  }
}
```

### R3: グレースフルデグラデーション（Graceful Degradation）
**対象**: Web版
**目的**: 非対応環境での適切なフォールバック（NFR-U1-06）

| 機能 | Tauri版 | Web版（対応ブラウザ） | Web版（非対応ブラウザ） |
|---|---|---|---|
| ファイルシステム | Tauri FS API | File System Access API | 利用不可（エラー表示） |
| セキュアストレージ | Stronghold | localStorage + 警告 | localStorage + 警告 |
| フォルダ選択 | Tauri Dialog | showDirectoryPicker | 利用不可 |
| ネイティブメニュー | Tauri Menu | なし（Webツールバーのみ） | なし |

---

## 構造パターン

### S1: アダプターパターン（Adapter Pattern）
**対象**: FileSystemAdapter, SecureStorage
**目的**: 環境差異の抽象化

```
+---------------------------+
| FileSystemAdapter (IF)    |  <-- コアコードはこのインターフェースのみ参照
+---------------------------+
        ^           ^
        |           |
+-------------+ +-------------+
| TauriFS     | | WebFS       |
| Adapter     | | Adapter     |
+-------------+ +-------------+
    |                |
    v                v
Tauri FS API    File System
                Access API
```

**アダプター選択**: `createFileSystemAdapter()` ファクトリ関数で環境に応じたインスタンスを返す（P1: 遅延初期化参照）

### S2: ストアパターン（Store Pattern）
**対象**: 全状態管理
**目的**: UIとビジネスロジックの分離、リアクティブ更新

```
SettingsManager          Svelte Store           UIコンポーネント
     |                       |                       |
     | set(key, value)       |                       |
     +-----> store.update()  |                       |
                             +-----> $store 変更検知  |
                                                     +---> 自動再レンダリング
```

**原則**:
- ビジネスロジックはStoreを直接更新
- UIコンポーネントは `$store` リアクティブ構文で購読
- UIからの操作はコンポーネントメソッド経由（Storeを直接更新しない）
