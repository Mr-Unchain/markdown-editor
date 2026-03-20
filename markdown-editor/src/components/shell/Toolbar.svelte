<script lang="ts">
  import { toggleSidebar, layoutState } from '$lib/stores/layout.svelte'
</script>

<header class="toolbar" data-testid="toolbar">
  <div class="toolbar-left">
    <button
      class="sidebar-toggle"
      onclick={toggleSidebar}
      aria-label={layoutState.sidebarVisible ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      data-testid="toolbar-sidebar-toggle"
    >
      <span class="toggle-icon">☰</span>
    </button>
    <span class="app-title" data-testid="toolbar-title">Markdown Editor</span>
  </div>

  <div class="toolbar-center" data-testid="toolbar-format-slot">
    <!-- Format toolbar slot: populated by U2 -->
  </div>

  <div class="toolbar-right" data-testid="toolbar-actions-slot">
    <!-- Action buttons slot: populated by U4 -->
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--toolbar-height);
    padding: 0 0.75rem;
    background: var(--color-toolbar-bg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toolbar-center {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: var(--color-text);
    font-size: 1rem;
    line-height: 1;
  }

  .sidebar-toggle:hover {
    background: var(--color-border);
  }

  .app-title {
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.7;
  }
</style>
