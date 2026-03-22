<script lang="ts">
  import type { Editor } from '@tiptap/core'

  let { editor, element = $bindable() }: { editor: Editor | null; element?: HTMLElement } = $props()
</script>

<div
  class="bubble-toolbar"
  role="toolbar"
  aria-label="インライン書式"
  bind:this={element}
  data-testid="bubble-toolbar"
>
  {#if editor}
    <button
      class="toolbar-btn"
      class:active={editor.isActive('bold')}
      onclick={() => editor?.chain().focus().toggleBold().run()}
      aria-pressed={editor.isActive('bold')}
      aria-label="太字"
      data-testid="bubble-bold"
    >B</button>
    <button
      class="toolbar-btn"
      class:active={editor.isActive('italic')}
      onclick={() => editor?.chain().focus().toggleItalic().run()}
      aria-pressed={editor.isActive('italic')}
      aria-label="斜体"
      data-testid="bubble-italic"
    >I</button>
    <button
      class="toolbar-btn"
      class:active={editor.isActive('strike')}
      onclick={() => editor?.chain().focus().toggleStrike().run()}
      aria-pressed={editor.isActive('strike')}
      aria-label="取り消し線"
      data-testid="bubble-strike"
    >S</button>
    <button
      class="toolbar-btn"
      class:active={editor.isActive('code')}
      onclick={() => editor?.chain().focus().toggleCode().run()}
      aria-pressed={editor.isActive('code')}
      aria-label="インラインコード"
      data-testid="bubble-code"
    >&lt;/&gt;</button>
    <button
      class="toolbar-btn"
      class:active={editor.isActive('link')}
      onclick={() => {
        if (editor?.isActive('link')) {
          editor.chain().focus().unsetLink().run()
        }
      }}
      aria-pressed={editor.isActive('link')}
      aria-label="リンク"
      data-testid="bubble-link"
    >🔗</button>
  {/if}
</div>
