<script lang="ts">
  import { layoutState } from '$lib/stores/layout.svelte'
  import { workspaceState } from '$lib/stores/workspace.svelte'
  import { fileTreeState } from '$lib/stores/file-tree.svelte'
  import SidebarHeader from '../sidebar/SidebarHeader.svelte'
  import FileTree from '../sidebar/FileTree.svelte'
  import WelcomeView from '../editor/WelcomeView.svelte'
  import type { FileTreeNode } from '$lib/types/workspace'

  interface Props {
    onSelectFile?: (node: FileTreeNode) => void
    onToggleFolder?: (node: FileTreeNode) => void
    onContextMenu?: (event: MouseEvent, node: FileTreeNode) => void
    onNewFile?: () => void
    onNewFolder?: () => void
    onOpenWorkspace?: () => void
  }

  let {
    onSelectFile,
    onToggleFolder,
    onContextMenu,
    onNewFile,
    onNewFolder,
    onOpenWorkspace,
  }: Props = $props()
</script>

{#if layoutState.sidebarVisible}
  <aside
    class="sidebar"
    style="width: {layoutState.sidebarWidth}px"
    data-testid="sidebar"
    aria-label="サイドバー"
  >
    {#if workspaceState.current}
      <SidebarHeader {onNewFile} {onNewFolder} />
      <FileTree
        nodes={fileTreeState.nodes}
        onSelect={onSelectFile}
        onToggle={onToggleFolder}
        {onContextMenu}
      />
    {:else}
      <div class="sidebar-empty" data-testid="sidebar-empty">
        <p class="sidebar-empty-text">ワークスペースを開いてください</p>
        <button
          class="sidebar-open-btn"
          onclick={onOpenWorkspace}
          data-testid="sidebar-open-workspace"
        >フォルダを開く</button>
      </div>
    {/if}
  </aside>
{/if}

<style>
  .sidebar {
    flex-shrink: 0;
    background: var(--color-sidebar-bg);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    animation: slide-in var(--sidebar-animation-duration) ease;
    display: flex;
    flex-direction: column;
  }

  @keyframes slide-in {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .sidebar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    padding: 1rem;
  }

  .sidebar-empty-text {
    color: var(--color-text);
    opacity: 0.4;
    font-size: 0.8125rem;
    text-align: center;
  }

  .sidebar-open-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .sidebar-open-btn:hover {
    opacity: 0.9;
  }
</style>
