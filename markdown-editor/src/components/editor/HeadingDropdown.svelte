<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { ActiveFormats } from '$lib/types/editor'

  let { editor, activeFormats }: { editor: Editor | null; activeFormats: ActiveFormats } = $props()

  let isOpen = $state(false)

  const options = [
    { id: 'paragraph', label: 'テキスト', level: 0 },
    { id: 'heading1', label: '見出し1', level: 1 },
    { id: 'heading2', label: '見出し2', level: 2 },
    { id: 'heading3', label: '見出し3', level: 3 },
  ] as const

  let selectedLabel = $derived(
    activeFormats.heading ? `見出し${activeFormats.heading}` : 'テキスト',
  )

  function select(level: number) {
    if (!editor) return
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run()
    }
    isOpen = false
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.heading-dropdown')) {
      isOpen = false
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="heading-dropdown" data-testid="heading-dropdown">
  <button
    class="dropdown-trigger"
    onclick={() => (isOpen = !isOpen)}
    disabled={!editor}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-label="見出しレベル"
    data-testid="heading-dropdown-trigger"
  >
    {selectedLabel} ▼
  </button>
  {#if isOpen}
    <div class="dropdown-menu" role="listbox" aria-label="見出しレベル選択">
      {#each options as option}
        <button
          class="dropdown-item"
          class:selected={option.level === 0 ? !activeFormats.heading : activeFormats.heading === option.level}
          role="option"
          aria-selected={option.level === 0 ? !activeFormats.heading : activeFormats.heading === option.level}
          onclick={() => select(option.level)}
          data-testid="heading-option-{option.id}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
