<script lang="ts">
  import type { ContextMenuAction } from '$lib/types/file-manager'

  interface MenuItem {
    action: ContextMenuAction
    label: string
    shortcut?: string
  }

  interface Props {
    isOpen: boolean
    position: { x: number; y: number }
    items: MenuItem[]
    onAction: (action: ContextMenuAction) => void
    onClose: () => void
  }

  let { isOpen, position, items, onAction, onClose }: Props = $props()

  let menuEl: HTMLElement | undefined = $state()

  $effect(() => {
    if (isOpen && menuEl) {
      menuEl.focus()
    }
  })

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusNext()
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusPrev()
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const focused = menuEl?.querySelector(':focus') as HTMLElement | null
      focused?.click()
    }
  }

  function focusNext() {
    const items = menuEl?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement> | undefined
    if (!items) return
    const current = Array.from(items).findIndex((el) => el === document.activeElement)
    const next = (current + 1) % items.length
    items[next]?.focus()
  }

  function focusPrev() {
    const menuItems = menuEl?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement> | undefined
    if (!menuItems) return
    const current = Array.from(menuItems).findIndex((el) => el === document.activeElement)
    const prev = (current - 1 + menuItems.length) % menuItems.length
    menuItems[prev]?.focus()
  }

  function handleAction(action: ContextMenuAction) {
    onAction(action)
    onClose()
  }
</script>

{#if isOpen}
  <div class="context-menu-overlay" onclick={onClose} role="presentation">
    <div
      bind:this={menuEl}
      class="context-menu"
      role="menu"
      tabindex={-1}
      style="left: {position.x}px; top: {position.y}px"
      onkeydown={handleKeydown}
      data-testid="context-menu"
    >
      {#each items as item}
        <button
          class="context-menu-item"
          role="menuitem"
          onclick={() => handleAction(item.action)}
          data-testid="context-menu-item-{item.action}"
        >
          <span>{item.label}</span>
          {#if item.shortcut}
            <span class="shortcut">{item.shortcut}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .context-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .context-menu {
    position: fixed;
    min-width: 180px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 0.25rem;
    z-index: 101;
  }

  .context-menu:focus {
    outline: none;
  }

  .context-menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.375rem 0.75rem;
    border: none;
    background: none;
    color: var(--color-text);
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: 4px;
    text-align: left;
  }

  .context-menu-item:hover,
  .context-menu-item:focus {
    background: var(--color-hover);
    outline: none;
  }

  .shortcut {
    font-size: 0.6875rem;
    opacity: 0.5;
    margin-left: 1rem;
  }
</style>
