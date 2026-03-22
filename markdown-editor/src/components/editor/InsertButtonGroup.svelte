<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { ActiveFormats } from '$lib/types/editor'

  let { editor, activeFormats }: { editor: Editor | null; activeFormats: ActiveFormats } = $props()

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  function toggleCodeBlock() {
    editor?.chain().focus().toggleCodeBlock().run()
  }

  function toggleBlockquote() {
    editor?.chain().focus().toggleBlockquote().run()
  }

  function insertHorizontalRule() {
    editor?.chain().focus().setHorizontalRule().run()
  }

  function toggleLink() {
    if (!editor) return
    if (activeFormats.link) {
      editor.chain().focus().unsetLink().run()
    } else {
      const url = '' // LinkPopoverで処理
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    }
  }
</script>

<div class="insert-button-group" role="group" aria-label="挿入">
  <button
    class="toolbar-btn"
    disabled={!editor}
    onclick={insertTable}
    title="テーブル"
    aria-label="テーブルを挿入"
    data-testid="insert-table"
  >
    <span class="toolbar-icon">⊞</span>
  </button>
  <button
    class="toolbar-btn"
    class:active={activeFormats.codeBlock}
    disabled={!editor}
    onclick={toggleCodeBlock}
    title="コードブロック"
    aria-pressed={activeFormats.codeBlock}
    aria-label="コードブロック"
    data-testid="insert-codeblock"
  >
    <span class="toolbar-icon">&lt;/&gt;</span>
  </button>
  <button
    class="toolbar-btn"
    class:active={activeFormats.blockquote}
    disabled={!editor}
    onclick={toggleBlockquote}
    title="引用"
    aria-pressed={activeFormats.blockquote}
    aria-label="引用"
    data-testid="insert-blockquote"
  >
    <span class="toolbar-icon">"</span>
  </button>
  <button
    class="toolbar-btn"
    disabled={!editor}
    onclick={insertHorizontalRule}
    title="区切り線"
    aria-label="区切り線を挿入"
    data-testid="insert-hr"
  >
    <span class="toolbar-icon">—</span>
  </button>
  <button
    class="toolbar-btn"
    class:active={activeFormats.link}
    disabled={!editor}
    onclick={toggleLink}
    title="リンク"
    aria-pressed={activeFormats.link}
    aria-label="リンク"
    data-testid="insert-link"
  >
    <span class="toolbar-icon">🔗</span>
  </button>
</div>
