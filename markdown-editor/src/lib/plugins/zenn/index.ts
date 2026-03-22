import type { PluginManifest, PluginInstance } from '$lib/types/plugin'
import { Node, mergeAttributes } from '@tiptap/core'

export const ZENN_MANIFEST: PluginManifest = {
  id: 'zenn-syntax',
  name: 'Zenn構文',
  version: '1.0.0',
  description: 'Zenn独自記法 (:::message, :::details)',
  type: 'platform-syntax',
  entryPoint: './plugins/zenn/index.ts',
}

/** Zenn メッセージブロック (:::message) */
const ZennMessage = Node.create({
  name: 'zennMessage',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      type: { default: 'message' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-zenn-message]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-zenn-message': '', class: 'zenn-message' }), 0]
  },
})

/** Zenn 詳細ブロック (:::details) */
const ZennDetails = Node.create({
  name: 'zennDetails',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      summary: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'details[data-zenn-details]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, { 'data-zenn-details': '' }),
      ['summary', {}, node.attrs.summary || '詳細'],
      ['div', {}, 0],
    ]
  },
})

/** Zenn構文プラグインをロードする */
export async function loadZennPlugin(): Promise<PluginInstance> {
  return {
    manifest: ZENN_MANIFEST,
    extensions: [ZennMessage, ZennDetails],
  }
}
