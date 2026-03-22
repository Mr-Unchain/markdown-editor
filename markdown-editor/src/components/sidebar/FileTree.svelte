<script lang="ts">
  import type { FileTreeNode } from '$lib/types/workspace'
  import FileTreeItem from './FileTreeItem.svelte'

  interface Props {
    nodes: FileTreeNode[]
    onSelect?: (node: FileTreeNode) => void
    onToggle?: (node: FileTreeNode) => void
    onContextMenu?: (event: MouseEvent, node: FileTreeNode) => void
  }

  let { nodes, onSelect, onToggle, onContextMenu }: Props = $props()
</script>

<div class="file-tree-container" data-testid="file-tree">
  {#if nodes.length === 0}
    <p class="empty-message" data-testid="file-tree-empty">
      ファイルがありません
    </p>
  {:else}
    <ul role="tree" aria-label="ファイルツリー" class="file-tree">
      {#each nodes as node (node.path)}
        <FileTreeItem
          {node}
          {onSelect}
          {onToggle}
          {onContextMenu}
        />
      {/each}
    </ul>
  {/if}
</div>

<style>
  .file-tree-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .file-tree {
    margin: 0;
    padding: 0.25rem 0;
  }

  .empty-message {
    text-align: center;
    color: var(--color-text);
    opacity: 0.4;
    font-size: 0.8125rem;
    padding: 2rem;
  }
</style>
