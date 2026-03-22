<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { ActiveFormats } from '$lib/types/editor'

  let { editor, activeFormats }: { editor: Editor | null; activeFormats: ActiveFormats } = $props()

  const buttons = [
    { key: 'bulletList' as const, label: '箇条書きリスト', icon: '•' },
    { key: 'orderedList' as const, label: '番号付きリスト', icon: '1.' },
    { key: 'taskList' as const, label: 'チェックリスト', icon: '☐' },
  ] as const

  function toggle(key: 'bulletList' | 'orderedList' | 'taskList') {
    if (!editor) return
    const commands: Record<string, () => void> = {
      bulletList: () => editor!.chain().focus().toggleBulletList().run(),
      orderedList: () => editor!.chain().focus().toggleOrderedList().run(),
      taskList: () => editor!.chain().focus().toggleTaskList().run(),
    }
    commands[key]()
  }
</script>

<div class="list-button-group" role="group" aria-label="リスト">
  {#each buttons as btn}
    <button
      class="toolbar-btn"
      class:active={activeFormats[btn.key]}
      disabled={!editor}
      onclick={() => toggle(btn.key)}
      title={btn.label}
      aria-pressed={activeFormats[btn.key]}
      aria-label={btn.label}
      data-testid="list-{btn.key}"
    >
      <span class="toolbar-icon">{btn.icon}</span>
    </button>
  {/each}
</div>
