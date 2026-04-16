# markdown editor
最高のマークダウンエディタをつくる

## ローカル開発とCI運用

### Frontend チェック（`markdown-editor/`）
```bash
cd markdown-editor
npm ci
npm run check
npm run lint
npm run test:run
npm run test:coverage
```

- Vitest のカバレッジ閾値は `lines: 80`, `branches: 70`, `functions: 80` を設定。
- pre-commit では `husky` + `lint-staged` により、変更ファイルへ `eslint --fix` と `prettier --write` を自動適用。

### Rust チェック（`markdown-editor/src-tauri/`）
```bash
cd markdown-editor/src-tauri
cargo test
cargo clippy --all-targets --all-features
```

### GitHub Actions
- `.github/workflows/ci.yml` で Frontend CI / Rust CI を実行。
- トリガーは `push (main)` と `pull_request`。
