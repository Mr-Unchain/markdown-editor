# Build Instructions

## Prerequisites
- **Runtime**: Node.js >= 18.x
- **Package Manager**: npm (bundled with Node.js)
- **Build Tool**: Vite 5.x (via SvelteKit)
- **Tauri CLI**: `@tauri-apps/cli` 2.x (デスクトップビルド時のみ)
- **Rust toolchain**: rustc 1.70+ (Tauriバックエンド用、デスクトップビルド時のみ)

## Build Steps

### 1. Install Dependencies

```bash
cd markdown-editor/markdown-editor
npm install
```

**確認**: `node_modules/` が生成され、エラーなし。

新規追加パッケージ（U4）:
- `gray-matter` ^4.x — Frontmatter解析
- `js-yaml` ^4.x — YAML処理（CVE対策engine override）
- `dompurify` ^3.x — HTML sanitization
- `zod` ^3.x (devDependencies) — 契約テストスキーマ

### 2. TypeScript Type Check

```bash
npm run check
```

**確認**: `svelte-kit sync` + `svelte-check` がエラーなしで完了。

**注意**: 以下のWarningは許容範囲:
- `$lib` alias解決のwarning（svelte-kit syncで解消）
- Tauri API importのwarning（Web環境では未使用パスだがdynamic import済み）

### 3. Build (Web版)

```bash
npm run build
```

**期待される出力**:
- `.svelte-kit/output/` に静的ビルド成果物が生成
- エラーなし、TypeScriptコンパイル成功

### 4. Build (Tauri デスクトップ版)

```bash
npm run tauri build
```

**前提条件**:
- Rust toolchainインストール済み
- `src-tauri/tauri.conf.json` 設定済み

**ビルド成果物**:
- Windows: `src-tauri/target/release/markdown-editor.exe`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/deb/`

### 5. Verify Build Success

- **Web Build**: `.svelte-kit/output/` 配下にHTML/JS/CSS生成を確認
- **Tauri Build**: 実行可能ファイルが生成されることを確認
- **ゼロエラー**: TypeScript型チェック、Svelteコンパイル共にエラーなし

## Troubleshooting

### Build Fails with Dependency Errors
- **原因**: `node_modules/` が不整合、lockfileの不一致
- **解決**: `rm -rf node_modules package-lock.json && npm install`

### Build Fails with TypeScript Errors
- **原因**: U4新規型定義の不整合
- **解決**: `npm run check` でエラー箇所を特定し修正

### Build Fails with Svelte Compilation Errors
- **原因**: Svelte 5 runes構文エラー（`$state`/`$derived`/`$props`）
- **解決**: `.svelte.ts` ファイルでのみ`$state`使用を確認、`.ts`ファイルではplain変数を使用

### Tauri Build Fails
- **原因**: Rust toolchain未インストール、Tauri CLI不一致
- **解決**: `rustup update && cargo install tauri-cli`
