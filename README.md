# markdown editor
最高のマークダウンエディタをつくる

## 生成物管理ポリシー

- `markdown-editor/build/` は CI/CD の build ステップで都度生成する成果物として扱い、Git では追跡しません。
- `markdown-editor/src-tauri/tauri.conf.json` の `build.frontendDist` は `"../build"` を参照するため、Tauri のパッケージング前に CI/CD で必ずフロントエンド build を実行してください。
- リポジトリ内でリリース成果物を保持しない方針とし、配布が必要な成果物は GitHub Releases などの Release assets で管理してください。

