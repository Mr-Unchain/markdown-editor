<script lang="ts">
  import type { Tab } from '$lib/types/workspace'
  import TabItem from './TabItem.svelte'

  interface Props {
    tabs: Tab[]
    onActivate?: (tab: Tab) => void
    onClose?: (tab: Tab) => void
    onReorder?: (fromIndex: number, toIndex: number) => void
  }

  let { tabs, onActivate, onClose, onReorder }: Props = $props()

  let dragIndex = $state<number | null>(null)

  function handleDragStart(index: number) {
    dragIndex = index
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault()
    if (dragIndex !== null && dragIndex !== index && onReorder) {
      onReorder(dragIndex, index)
      dragIndex = index
    }
  }

  function handleDragEnd() {
    dragIndex = null
  }

  function handleKeydown(event: KeyboardEvent) {
    const activeIndex = tabs.findIndex((t) => t.isActive)
    if (activeIndex === -1) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = (activeIndex + 1) % tabs.length
      onActivate?.(tabs[next]!)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prev = (activeIndex - 1 + tabs.length) % tabs.length
      onActivate?.(tabs[prev]!)
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'ArrowRight' && onReorder) {
      event.preventDefault()
      const next = Math.min(activeIndex + 1, tabs.length - 1)
      if (next !== activeIndex) onReorder(activeIndex, next)
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'ArrowLeft' && onReorder) {
      event.preventDefault()
      const prev = Math.max(activeIndex - 1, 0)
      if (prev !== activeIndex) onReorder(activeIndex, prev)
    }
  }
</script>

{#if tabs.length > 0}
  <div
    class="tab-bar"
    role="tablist"
    aria-label="開いているファイル"
    onkeydown={handleKeydown}
    data-testid="tab-bar"
  >
    {#each tabs as tab, index (tab.filePath)}
      <div
        draggable="true"
        ondragstart={() => handleDragStart(index)}
        ondragover={(e) => handleDragOver(e, index)}
        ondragend={handleDragEnd}
        class="tab-drag-wrapper"
        class:dragging={dragIndex === index}
      >
        <TabItem
          {tab}
          {onActivate}
          {onClose}
        />
      </div>
    {/each}
  </div>
{/if}

<style>
  .tab-bar {
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-tab-bar-bg, var(--color-bg));
    flex-shrink: 0;
    scrollbar-width: thin;
  }

  .tab-bar::-webkit-scrollbar {
    height: 3px;
  }

  .tab-drag-wrapper {
    display: contents;
  }

  .tab-drag-wrapper.dragging :global(.tab-item) {
    opacity: 0.5;
  }
</style>
