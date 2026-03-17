# U1: Foundation - Tech Stack Decisions

## コアフレームワーク

| カテゴリ | 選定 | バージョン | 理由 |
|---|---|---|---|
| フレームワーク | SvelteKit | 2.x (latest) | 軽量、高速SSR/CSR、バンドルサイズ最小 |
| デスクトップ | Tauri | 2.x (latest) | Rust製、Electronより大幅に軽量（~10MB vs ~150MB） |
| 言語 | TypeScript | 5.x (latest) | 型安全、開発効率向上 |
| ビルドツール | Vite | 6.x (SvelteKit同梱) | 高速HMR、SvelteKitのデフォルトバンドラー |

## パッケージマネージャー

| 選定 | バージョン | 理由 |
|---|---|---|
| **pnpm** | 9.x (latest) | npm比3倍高速、ディスク効率良好、Tauri公式ドキュメントで推奨 |

## テストフレームワーク

| カテゴリ | 選定 | 理由 |
|---|---|---|
| ユニットテスト | **Vitest** | Viteネイティブ統合、SvelteKit公式推奨、高速 |
| コンポーネントテスト | **@testing-library/svelte** | Svelteコンポーネントのテストに最適 |
| E2Eテスト | **Playwright** | クロスブラウザ対応、Tauri E2Eテスト可能 |

## Tauriプラグイン

| プラグイン | 用途 |
|---|---|
| `@tauri-apps/plugin-fs` | ファイルシステム操作 |
| `@tauri-apps/plugin-dialog` | ファイル/フォルダ選択ダイアログ |
| `@tauri-apps/plugin-stronghold` | 認証情報のセキュアストレージ |
| `@tauri-apps/plugin-process` | アプリ終了時のクリーンアップ |
| `@tauri-apps/plugin-shell` | 外部コマンド実行（Git連携用、Post-MVP） |

## 開発ツール

| ツール | 用途 |
|---|---|
| ESLint | コード品質チェック |
| Prettier | コードフォーマット |
| svelte-check | Svelte型チェック |
| TypeScript (`tsc --noEmit`) | 型チェック |

## コード品質設定

### TypeScript設定（抜粋）
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

### ESLint設定方針
- `eslint-plugin-svelte` で Svelte固有ルール適用
- `@typescript-eslint` で TypeScript固有ルール適用
- `no-console` は `warn` レベル（開発時のログ許容）

### Prettier設定方針
- セミコロン: なし
- シングルクォート: あり
- タブ幅: 2スペース
- プラグイン: `prettier-plugin-svelte`

---

## パッケージ依存関係サマリー

### dependencies
```
@tauri-apps/api
@tauri-apps/plugin-fs
@tauri-apps/plugin-dialog
@tauri-apps/plugin-stronghold
@tauri-apps/plugin-process
```

### devDependencies
```
@sveltejs/kit
@sveltejs/adapter-static
svelte
typescript
vite
vitest
@testing-library/svelte
playwright
eslint
eslint-plugin-svelte
@typescript-eslint/eslint-plugin
prettier
prettier-plugin-svelte
svelte-check
```

## ビルド設定

### SvelteKit アダプター
- **adapter-static** を使用（Tauriはスタティックビルドを要求）
- Web版もスタティックホスティング可能

### Viteビルド最適化
- コード分割: 自動（Viteデフォルト）
- Tree shaking: 有効
- ソースマップ: 開発時のみ
- ミニファイ: esbuild（デフォルト）
