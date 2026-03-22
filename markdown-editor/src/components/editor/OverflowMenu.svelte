<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, visible = false }: { children: Snippet; visible: boolean } = $props()

  let isOpen = $state(false)

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.overflow-menu')) {
      isOpen = false
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

{#if visible}
  <div class="overflow-menu" data-testid="overflow-menu">
    <button
      class="toolbar-btn overflow-trigger"
      onclick={() => (isOpen = !isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label="その他のツール"
      data-testid="overflow-trigger"
    >
      <span class="toolbar-icon">⋯</span>
    </button>
    {#if isOpen}
      <div class="overflow-dropdown" role="menu" aria-label="追加ツール">
        {@render children()}
      </div>
    {/if}
  </div>
{/if}
