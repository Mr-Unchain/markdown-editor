<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { ActiveFormats } from '$lib/types/editor'

  let { editor, activeFormats }: { editor: Editor | null; activeFormats: ActiveFormats } = $props()

  const buttons = [
    { key: 'bold' as const, label: '太字', icon: 'B', shortcut: 'Ctrl+B' },
    { key: 'italic' as const, label: '斜体', icon: 'I', shortcut: 'Ctrl+I' },
    { key: 'strike' as const, label: '取り消し線', icon: 'S', shortcut: 'Ctrl+Shift+X' },
    { key: 'code' as const, label: 'インラインコード', icon: '</>', shortcut: 'Ctrl+E' },
  ] as const

  function toggle(key: 'bold' | 'italic' | 'strike' | 'code') {
    if (!editor) return
    const commands: Record<string, () => void> = {
      bold: () => editor!.chain().focus().toggleBold().run(),
      italic: () => editor!.chain().focus().toggleItalic().run(),
      strike: () => editor!.chain().focus().toggleStrike().run(),
      code: () => editor!.chain().focus().toggleCode().run(),
    }
    commands[key]()
  }
</script>

<div class="format-button-group" role="group" aria-label="書式">
  {#each buttons as btn}
    <button
      class="toolbar-btn"
      class:active={activeFormats[btn.key]}
      disabled={!editor}
      onclick={() => toggle(btn.key)}
      title="{btn.label} ({btn.shortcut})"
      aria-pressed={activeFormats[btn.key]}
      aria-label={btn.label}
      data-testid="format-{btn.key}"
    >
      <span class="toolbar-icon">{btn.icon}</span>
    </button>
  {/each}
</div>
