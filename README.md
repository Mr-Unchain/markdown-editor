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
=======
## 生成物管理ポリシー

- `markdown-editor/build/` は CI/CD の build ステップで都度生成する成果物として扱い、Git では追跡しません。
- `markdown-editor/src-tauri/tauri.conf.json` の `build.frontendDist` は `"../build"` を参照するため、Tauri のパッケージング前に CI/CD で必ずフロントエンド build を実行してください。
- リポジトリ内でリリース成果物を保持しない方針とし、配布が必要な成果物は GitHub Releases などの Release assets で管理してください。
