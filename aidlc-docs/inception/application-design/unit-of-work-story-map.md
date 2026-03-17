# Unit of Work ストーリーマッピング

## MVP ストーリー → ユニット割り当て

| ストーリーID | ストーリー名 | ユニット | 優先度 |
|---|---|---|---|
| US-01 | リッチテキスト編集 | U2: Core Editor | MVP |
| US-02 | リスト・チェックリスト編集 | U2: Core Editor | MVP |
| US-03 | テーブル編集 | U2: Core Editor | MVP |
| US-04 | コードブロック編集 | U2: Core Editor | MVP |
| US-05 | 引用・区切り線・リンク | U2: Core Editor | MVP |
| US-06 | スラッシュコマンド | U2: Core Editor | MVP |
| US-07 | キーボードショートカット | U2: Core Editor | MVP |
| US-08 | Undo/Redo | U2: Core Editor | MVP |
| US-09 | ワークスペース管理 | U3: File Management | MVP |
| US-10 | ファイル操作 | U3: File Management | MVP |
| US-11 | 複数タブ編集 | U3: File Management | MVP |
| US-12 | Zenn記事投稿 | U4: Platform Integration | MVP |
| US-16 | プラットフォーム向けエクスポート | U4: Platform Integration | MVP |
| US-17 | 画像挿入 | U4: Platform Integration | MVP |
| US-18 | プラットフォーム画像アップロード | U4: Platform Integration | MVP |
| US-22 | プラットフォーム接続設定 | U4: Platform Integration | MVP |

## Post-MVP ストーリー → ユニット割り当て

| ストーリーID | ストーリー名 | ユニット | 優先度 |
|---|---|---|---|
| US-13 | note記事投稿 | U4: Platform Integration | Post-MVP |
| US-14 | microCMSコンテンツ投稿 | U4: Platform Integration | Post-MVP |
| US-15 | Contentfulコンテンツ投稿 | U4: Platform Integration | Post-MVP |
| US-19 | プラグインの管理 | U2: Core Editor (PluginSystem拡張) | Post-MVP |
| US-20 | Markdown構文プラグイン | U2: Core Editor (Plugin) | Post-MVP |
| US-21 | プラットフォーム構文プラグイン | U2: Core Editor (Plugin) | Post-MVP |
| US-23 | エディター表示設定 | U1: Foundation (SettingsManager拡張) | Post-MVP |

## ユニット別サマリー

| ユニット | MVPストーリー | Post-MVPストーリー | 合計 |
|---|---|---|---|
| U1: Foundation | 0 | 1 | 1 |
| U2: Core Editor | 8 | 3 | 11 |
| U3: File Management | 3 | 0 | 3 |
| U4: Platform Integration | 5 | 3 | 8 |
| **合計** | **16** | **7** | **23** |

## カバレッジ確認

- **全23ストーリー**が少なくとも1つのユニットに割り当て済み
- **割り当て漏れ**: なし
- **重複割り当て**: なし
