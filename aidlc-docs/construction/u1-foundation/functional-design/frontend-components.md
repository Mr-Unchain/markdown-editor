# U1: Foundation - フロントエンドコンポーネント

## コンポーネント階層

```
+layout.svelte (UIShell)
|
+-- Toolbar.svelte
|   +-- SidebarToggle.svelte
|   +-- FileTitle.svelte
|   +-- FormatToolbar.svelte      (U2で実装、ここではスロット)
|   +-- ActionButtons.svelte
|       +-- PublishButton.svelte  (U4で実装、ここではスロット)
|       +-- SettingsButton.svelte
|
+-- Sidebar.svelte
|   +-- FileTree.svelte           (U3で実装、ここではスロット)
|   +-- SettingsPanel.svelte      (U4で実装、ここではスロット)
|
+-- EditorArea.svelte
|   +-- (EditorCore mount point)  (U2で実装、ここではスロット)
|
+-- StatusBar.svelte
|   +-- CharCount.svelte
|   +-- LineCount.svelte
|   +-- SaveStatus.svelte
|   +-- ConnectionStatus.svelte
|
+-- NotificationContainer.svelte
|   +-- NotificationToast.svelte
|
+-- ConfirmDialog.svelte
```

## 各コンポーネントの定義

### +layout.svelte (UIShell ルートレイアウト)

**Props**: なし（SvelteKitレイアウト）

**State (Svelte Store)**:
```typescript
// stores/layout.ts
export const layoutState = writable<LayoutState>({
  sidebarVisible: false,
  sidebarWidth: 260,
  sidebarPanel: 'file-tree',
})
```

**ユーザーインタラクション**:
- キーボードショートカット `Ctrl/Cmd+\` でサイドバートグル
- ウィンドウリサイズ時にレイアウト再計算

---

### Toolbar.svelte

**Props**:
```typescript
{
  fileName: string | null     // 現在開いているファイル名
  isDirty: boolean            // 未保存変更あり
}
```

**構成**:
- 左: SidebarToggle + FileTitle（ファイル名 + 未保存インジケーター `●`）
- 中: FormatToolbar スロット（U2で差し込み）
- 右: ActionButtons

---

### Sidebar.svelte

**Props**:
```typescript
{
  visible: boolean
  width: number
  activePanel: SidebarPanel
}
```

**動作**:
- `visible=false` 時: `transform: translateX(-100%)` でスライドアウト
- `visible=true` 時: `transform: translateX(0)` でスライドイン
- トランジション: 200ms ease-in-out

---

### EditorArea.svelte

**Props**:
```typescript
{
  maxWidth: number  // editorWidth設定値
}
```

**スタイル**:
- `max-width: {maxWidth}px`
- `margin: 0 auto`
- `padding: 2rem`
- サイドバー表示時: `margin-left: {sidebarWidth}px` に調整

---

### StatusBar.svelte

**Props**:
```typescript
{
  charCount: number
  lineCount: number
  saveStatus: 'saved' | 'unsaved' | 'saving'
  connectionStatus: 'connected' | 'disconnected' | 'none'
}
```

**表示**:
- 文字数: `{charCount} 文字`
- 行数: `{lineCount} 行`
- 保存状態: `保存済み` / `● 未保存` / `保存中...`
- 接続状態: プラットフォーム接続アイコン（U4で実装）

---

### NotificationContainer.svelte

**State (Svelte Store)**:
```typescript
// stores/notifications.ts
export const notifications = writable<Notification[]>([])

export function notify(type: Notification['type'], message: string, duration?: number): void {
  const id = crypto.randomUUID()
  const defaultDuration = { success: 3000, info: 5000, warning: 5000, error: 0 }
  notifications.update(n => {
    const updated = [...n, { id, type, message, duration: duration ?? defaultDuration[type] }]
    return updated.slice(-3)  // 最大3件
  })
}

export function dismissNotification(id: string): void {
  notifications.update(n => n.filter(item => item.id !== id))
}
```

---

### ConfirmDialog.svelte

**Props**:
```typescript
{
  open: boolean
  title: string
  message: string
  confirmLabel: string    // デフォルト: "OK"
  cancelLabel: string     // デフォルト: "キャンセル"
  onConfirm: () => void
  onCancel: () => void
}
```

**用途**: ファイル削除確認、未保存で閉じる確認、認証情報削除確認 等

---

## Svelte Store 一覧（U1で定義）

| Store | 型 | 用途 |
|---|---|---|
| `layoutState` | `Writable<LayoutState>` | サイドバー状態、レイアウト設定 |
| `notifications` | `Writable<Notification[]>` | 通知メッセージ一覧 |
| `appSettings` | `Writable<AppSettings>` | アプリケーション設定 |
| `currentFile` | `Writable<{ path: string; name: string } | null>` | 現在編集中のファイル情報 |
| `saveStatus` | `Writable<'saved' | 'unsaved' | 'saving'>` | 保存状態 |
