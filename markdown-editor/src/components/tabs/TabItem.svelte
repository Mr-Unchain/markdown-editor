<script lang="ts">
  import type { Tab } from '$lib/types/workspace'

  interface Props {
    tab: Tab
    onActivate?: (tab: Tab) => void
    onClose?: (tab: Tab) => void
  }

  let { tab, onActivate, onClose }: Props = $props()

  function handleClose(event: MouseEvent) {
    event.stopPropagation()
    onClose?.(tab)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.(tab)
    }
    if (event.key === 'Delete' || (event.key === 'w' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault()
      onClose?.(tab)
    }
  }
</script>

<div
  class="tab-item"
  class:active={tab.isActive}
  class:dirty={tab.isDirty}
  role="tab"
  aria-selected={tab.isActive}
  tabindex={tab.isActive ? 0 : -1}
  onclick={() => onActivate?.(tab)}
  onkeydown={handleKeydown}
  data-testid="tab-item"
  data-path={tab.filePath}
>
  <span class="tab-name">
    {#if tab.isDirty}
      <span class="dirty-indicator" aria-label="未保存">●</span>
    {/if}
    {tab.displayName}
  </span>
  <button
    class="tab-close-btn"
    onclick={handleClose}
    aria-label="{tab.displayName}を閉じる"
    tabindex={-1}
    data-testid="tab-close-btn"
  >×</button>
</div>

<style>
  .tab-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    cursor: pointer;
    font-size: 0.8125rem;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
  }

  .tab-item:hover {
    background: var(--color-hover);
  }

  .tab-item.active {
    border-bottom-color: var(--color-primary);
    background: var(--color-tab-active-bg, transparent);
  }

  .tab-item:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .tab-name {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dirty-indicator {
    color: var(--color-warning);
    font-size: 0.5rem;
  }

  .tab-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0.125rem;
    font-size: 0.875rem;
    color: var(--color-text);
    opacity: 0;
    border-radius: 3px;
    line-height: 1;
  }

  .tab-item:hover .tab-close-btn {
    opacity: 0.5;
  }

  .tab-close-btn:hover {
    opacity: 1 !important;
    background: var(--color-hover);
  }
</style>
