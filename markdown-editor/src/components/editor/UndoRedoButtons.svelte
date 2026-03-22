<script lang="ts">
  import type { Editor } from '@tiptap/core'

  let { editor, canUndo, canRedo }: { editor: Editor | null; canUndo: boolean; canRedo: boolean } = $props()
</script>

<div class="undo-redo-buttons" role="group" aria-label="元に戻す/やり直し">
  <button
    class="toolbar-btn"
    disabled={!editor || !canUndo}
    onclick={() => editor?.chain().focus().undo().run()}
    title="元に戻す (Ctrl+Z)"
    aria-label="元に戻す"
    data-testid="undo-button"
  >
    <span class="toolbar-icon">↶</span>
  </button>
  <button
    class="toolbar-btn"
    disabled={!editor || !canRedo}
    onclick={() => editor?.chain().focus().redo().run()}
    title="やり直し (Ctrl+Shift+Z)"
    aria-label="やり直し"
    data-testid="redo-button"
  >
    <span class="toolbar-icon">↷</span>
  </button>
</div>
