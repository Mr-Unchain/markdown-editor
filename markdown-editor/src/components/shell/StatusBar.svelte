<script lang="ts">
  import { saveState, setAutoSaveMode } from '$lib/stores/save-status.svelte'
  import { fileState } from '$lib/stores/current-file.svelte'
  import { tabsState, getActiveTab } from '$lib/stores/tabs.svelte'

  const statusLabels = {
    saved: '保存済み',
    unsaved: '未保存',
    saving: '保存中...',
    error: '保存エラー',
  } as const

  function toggleAutoSave() {
    const newMode = saveState.autoSaveMode === 'auto' ? 'manual' : 'auto'
    setAutoSaveMode(newMode)
  }
</script>

<footer class="statusbar" data-testid="statusbar">
  <div class="statusbar-left">
    {#if fileState.current}
      <span class="statusbar-item" data-testid="statusbar-filepath">
        {fileState.current.path}
      </span>
    {/if}
  </div>

  <div class="statusbar-right">
    <button
      class="statusbar-item auto-save-toggle"
      onclick={toggleAutoSave}
      aria-label="自動保存の切替"
      data-testid="statusbar-autosave-toggle"
    >
      {saveState.autoSaveMode === 'auto' ? '自動保存: ON' : '自動保存: OFF'}
    </button>

    <span
      class="statusbar-item save-status"
      class:saved={saveState.status === 'saved'}
      class:unsaved={saveState.status === 'unsaved'}
      class:error={saveState.status === 'error'}
      data-testid="statusbar-save-status"
    >
      {statusLabels[saveState.status]}
    </span>

    {#if tabsState.tabs.length > 0}
      <span class="statusbar-item" data-testid="statusbar-tab-count">
        タブ: {tabsState.tabs.length}
      </span>
    {/if}
  </div>
</footer>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--statusbar-height);
    padding: 0 0.75rem;
    background: var(--color-statusbar-bg);
    border-top: 1px solid var(--color-border);
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .statusbar-left,
  .statusbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .statusbar-item {
    opacity: 0.7;
  }

  .auto-save-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: inherit;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
  }

  .auto-save-toggle:hover {
    opacity: 1;
    background: var(--color-hover);
  }

  .save-status.saved { color: var(--color-success); }
  .save-status.unsaved { color: var(--color-warning); }
  .save-status.error { color: var(--color-error); }
</style>
