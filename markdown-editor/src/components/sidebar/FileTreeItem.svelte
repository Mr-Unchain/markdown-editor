<script lang="ts">
  import type { FileTreeNode } from '$lib/types/workspace'

  interface Props {
    node: FileTreeNode
    depth?: number
    onSelect?: (node: FileTreeNode) => void
    onToggle?: (node: FileTreeNode) => void
    onContextMenu?: (event: MouseEvent, node: FileTreeNode) => void
  }

  let { node, depth = 0, onSelect, onToggle, onContextMenu }: Props = $props()

  function handleClick() {
    if (node.isDirectory) {
      onToggle?.(node)
    } else {
      onSelect?.(node)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
    if (event.key === 'ArrowRight' && node.isDirectory && !node.isExpanded) {
      event.preventDefault()
      onToggle?.(node)
    }
    if (event.key === 'ArrowLeft' && node.isDirectory && node.isExpanded) {
      event.preventDefault()
      onToggle?.(node)
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    onContextMenu?.(event, node)
  }
</script>

<li
  role="treeitem"
  aria-expanded={node.isDirectory ? node.isExpanded : undefined}
  aria-selected={node.isSelected}
  data-testid="file-tree-item"
  data-path={node.path}
>
  <div
    class="tree-item-content"
    class:selected={node.isSelected}
    class:directory={node.isDirectory}
    style="padding-left: {depth * 16 + 8}px"
    tabindex={0}
    onclick={handleClick}
    onkeydown={handleKeydown}
    oncontextmenu={handleContextMenu}
  >
    {#if node.isDirectory}
      <span class="tree-icon" aria-hidden="true">
        {node.isExpanded ? '▼' : '▶'}
      </span>
    {:else}
      <span class="tree-icon file-icon" aria-hidden="true">📄</span>
    {/if}
    <span class="tree-item-name">{node.name}</span>
  </div>

  {#if node.isDirectory && node.isExpanded && node.children.length > 0}
    <ul role="group" class="tree-children">
      {#each node.children as child (child.path)}
        <svelte:self
          node={child}
          depth={depth + 1}
          {onSelect}
          {onToggle}
          {onContextMenu}
        />
      {/each}
    </ul>
  {/if}
</li>

<style>
  li {
    list-style: none;
  }

  .tree-item-content {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    height: 28px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.8125rem;
    user-select: none;
  }

  .tree-item-content:hover {
    background: var(--color-hover);
  }

  .tree-item-content.selected {
    background: var(--color-selected);
  }

  .tree-item-content:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .tree-icon {
    font-size: 0.625rem;
    width: 1rem;
    text-align: center;
    flex-shrink: 0;
  }

  .file-icon {
    font-size: 0.75rem;
  }

  .tree-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-children {
    margin: 0;
    padding: 0;
  }
</style>
