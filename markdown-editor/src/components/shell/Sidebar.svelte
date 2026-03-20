<script lang="ts">
  import { layoutState } from '$lib/stores/layout.svelte'
</script>

{#if layoutState.sidebarVisible}
  <aside
    class="sidebar"
    style="width: {layoutState.sidebarWidth}px"
    data-testid="sidebar"
    aria-label="サイドバー"
  >
    <div class="sidebar-content">
      {#if layoutState.sidebarPanel === 'files'}
        <div class="sidebar-panel" data-testid="sidebar-files-panel">
          <p class="panel-placeholder">ファイルツリー（U3で実装）</p>
        </div>
      {:else if layoutState.sidebarPanel === 'settings'}
        <div class="sidebar-panel" data-testid="sidebar-settings-panel">
          <p class="panel-placeholder">設定パネル（U4で実装）</p>
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .sidebar {
    flex-shrink: 0;
    background: var(--color-sidebar-bg);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    animation: slide-in var(--sidebar-animation-duration) ease;
  }

  @keyframes slide-in {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .sidebar-content {
    padding: 0.5rem;
    height: 100%;
  }

  .sidebar-panel {
    height: 100%;
  }

  .panel-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text);
    opacity: 0.3;
    font-size: 0.875rem;
  }
</style>
