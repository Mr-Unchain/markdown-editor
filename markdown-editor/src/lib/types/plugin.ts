import type { Extension } from '@tiptap/core'

/** プラグインマニフェスト */
export interface PluginManifest {
  /** 一意識別子 */
  id: string
  /** 表示名 */
  name: string
  /** バージョン */
  version: string
  /** 説明 */
  description: string
  /** プラグイン種別 */
  type: 'editor-extension' | 'platform-syntax' | 'export-transformer'
  /** エントリーポイント（遅延ロード用パス） */
  entryPoint: string
}

/** プラグインインスタンス（ロード後） */
export interface PluginInstance {
  /** マニフェスト */
  manifest: PluginManifest
  /** Tiptapエクステンション（editor-extension 型のみ） */
  extensions?: Extension[]
  /** クリーンアップ関数 */
  destroy?: () => void
}

/** プラグイン設定（SettingsManager内） */
export interface PluginConfig {
  /** プラグインID → 有効/無効 */
  enabled: Record<string, boolean>
}

/** 同梱プラグインの種別 */
export type BundledPluginId = 'katex' | 'mermaid' | 'zenn-syntax'
