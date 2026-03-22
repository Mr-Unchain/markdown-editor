import type { PluginManifest, PluginInstance } from '$lib/types/plugin'
import { Node, mergeAttributes } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export const MERMAID_MANIFEST: PluginManifest = {
  id: 'mermaid',
  name: 'Mermaid 図表',
  version: '1.0.0',
  description: '図表レンダリング (```mermaid)',
  type: 'editor-extension',
  entryPoint: './plugins/mermaid/index.ts',
}

let mermaidIdCounter = 0

/** Mermaid ブロックノード */
const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'mermaid-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mermaid-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ({ node }: { node: ProseMirrorNode }) => {
      const dom = document.createElement('div')
      dom.className = 'mermaid-block'
      dom.setAttribute('data-testid', 'mermaid-block')

      const renderDiagram = async () => {
        try {
          const { default: mermaid } = await import('mermaid')
          mermaid.initialize({ startOnLoad: false, theme: 'default' })
          const id = `mermaid-${mermaidIdCounter++}`
          const { svg } = await mermaid.render(id, node.attrs.code)
          dom.innerHTML = svg
        } catch {
          dom.textContent = `[Mermaid] ${node.attrs.code}`
          dom.classList.add('mermaid-error')
        }
      }
      renderDiagram()

      return { dom }
    }
  },
})

/** Mermaidプラグインをロードする */
export async function loadMermaidPlugin(): Promise<PluginInstance> {
  return {
    manifest: MERMAID_MANIFEST,
    extensions: [MermaidBlock],
  }
}
