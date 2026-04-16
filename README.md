# markdown editor

最高のマークダウンエディタをつくる。

## 開発環境

このリポジトリでは **pnpm** に統一しています。npm は使用しません。

### 前提

- Node.js 20 以上
- pnpm 9 以上

### セットアップ

```bash
cd markdown-editor
pnpm install
```

### ローカル開発

```bash
cd markdown-editor
pnpm dev
```

### ビルド / テスト

```bash
cd markdown-editor
pnpm check
pnpm test:run
pnpm build
```

## CI

CI も pnpm で依存解決・チェック・テスト・ビルドを実行します。
