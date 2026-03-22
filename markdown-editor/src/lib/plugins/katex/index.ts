import type { PluginManifest, PluginInstance } from '$lib/types/plugin'
import { Node, mergeAttributes } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export const KATEX_MANIFEST: PluginManifest = {
  id: 'katex',
  name: 'KaTeX 数式',
  version: '1.0.0',
  description: '数式レンダリング ($...$ / $$...$$)',
  type: 'editor-extension',
  entryPoint: './plugins/katex/index.ts',
}

/** KaTeX インラインノード */
const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      formula: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'math-inline' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['math-inline', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ({ node }: { node: ProseMirrorNode }) => {
      const dom = document.createElement('span')
      dom.className = 'math-inline'
      dom.setAttribute('data-testid', 'math-inline')

      const renderFormula = async () => {
        try {
          const katex = await import('katex')
          katex.default.render(node.attrs.formula, dom, {
            throwOnError: false,
            displayMode: false,
          })
        } catch {
          dom.textContent = node.attrs.formula
        }
      }
      renderFormula()

      return { dom }
    }
  },
})

/** KaTeX ブロックノード */
const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      formula: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'math-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['math-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ({ node }: { node: ProseMirrorNode }) => {
      const dom = document.createElement('div')
      dom.className = 'math-block'
      dom.setAttribute('data-testid', 'math-block')

      const renderFormula = async () => {
        try {
          const katex = await import('katex')
          katex.default.render(node.attrs.formula, dom, {
            throwOnError: false,
            displayMode: true,
          })
        } catch {
          dom.textContent = node.attrs.formula
        }
      }
      renderFormula()

      return { dom }
    }
  },
})

/** KaTeXプラグインをロードする */
export async function loadKatexPlugin(): Promise<PluginInstance> {
  return {
    manifest: KATEX_MANIFEST,
    extensions: [MathInline, MathBlock],
  }
}
