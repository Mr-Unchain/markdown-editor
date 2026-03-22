<script lang="ts">
  import { workspaceState } from '$lib/stores/workspace.svelte'

  interface Props {
    onNewFile?: () => void
    onNewFolder?: () => void
    onFilterToggle?: () => void
  }

  let { onNewFile, onNewFolder, onFilterToggle }: Props = $props()
</script>

<div class="sidebar-header" data-testid="sidebar-header">
  <h2 class="workspace-name" data-testid="workspace-name">
    {workspaceState.current?.name ?? 'ワークスペース未選択'}
  </h2>
  {#if workspaceState.current}
    <div class="sidebar-actions">
      <button
        class="sidebar-action-btn"
        onclick={onNewFile}
        aria-label="新規ファイル"
        data-testid="btn-new-file"
      >+</button>
      <button
        class="sidebar-action-btn"
        onclick={onNewFolder}
        aria-label="新規フォルダ"
        data-testid="btn-new-folder"
      >📁</button>
      <button
        class="sidebar-action-btn"
        onclick={onFilterToggle}
        aria-label="フィルター切替"
        data-testid="btn-filter-toggle"
      >⚙</button>
    </div>
  {/if}
</div>

<style>
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .workspace-name {
    font-size: 0.8125rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .sidebar-actions {
    display: flex;
    gap: 0.25rem;
  }

  .sidebar-action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--color-text);
    opacity: 0.7;
  }

  .sidebar-action-btn:hover {
    opacity: 1;
    background: var(--color-hover);
  }

  .sidebar-action-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }
</style>
