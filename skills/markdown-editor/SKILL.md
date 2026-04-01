# Markdown Editor - Project Skill

## 技術スタック
- **フレームワーク**: Svelte (TypeScript)
- **言語構成**: TypeScript 76.6%, Svelte 20.5%, CSS 2.4%
- **ビルドツール**: Vite (推定、Svelte + TypeScript の標準構成)
- **ワークフロー**: AIDLC (AI-Driven Development Lifecycle) を CLAUDE.md で定義済み

## プロジェクト構造
```
markdown-editor/
├── .aidlc-rule-details/   # AIDLC ワークフローのルール詳細
├── .claude/                # Claude Code の設定とサブエージェント
│   ├── agents/             # explore, review サブエージェント定義
│   └── settings.json       # 権限設定
├── aidlc-docs/             # AIDLC が生成するドキュメント
├── markdown-editor/        # アプリ本体のソースコード
├── skills/                 # プロジェクトスキル (このファイル)
├── CLAUDE.md               # AIDLC ワークフロー定義
└── README.md
```

## コーディング規約

### TypeScript
- strict モードを使用する
- any 型の使用を避ける。unknown + 型ガードを使う
- 関数には明示的な戻り値の型を付ける
- interface を type alias より優先する（オブジェクト型の場合）

### Svelte コンポーネント
- `<script lang="ts">` を常に使用
- props は明示的に型定義する
- コンポーネントファイル名は PascalCase
- 1コンポーネント1責務を守る
- イベントハンドラは `handle` プレフィックス (例: `handleClick`)

### テスト
- テストフレームワーク: vitest (推奨)
- テストファイルは `*.test.ts` または `*.spec.ts`
- ユーティリティ関数は必ずユニットテストを書く
- コンポーネントテストは @testing-library/svelte を使用
- テストの構造: Arrange → Act → Assert

## リファクタリング方針
1. **まず調査**: 変更前に explore サブエージェントでコードベースを調査する
2. **小さく変更**: 1つのコミットで1つの論理的な変更
3. **テストを先に**: リファクタリング前に既存の動作を保証するテストを書く
4. **変更後にレビュー**: review サブエージェントで品質を検証する

## コマンド
- `npm run dev` — 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npx vitest` — テスト実行
- `npx vitest --coverage` — カバレッジ付きテスト実行
- `npx svelte-check` — 型チェック
