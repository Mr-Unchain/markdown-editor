<script lang="ts">
  import { saveState } from '$lib/stores/save-status.svelte'
  import { fileState } from '$lib/stores/current-file.svelte'

  const statusLabels = {
    saved: '保存済み',
    unsaved: '未保存',
    saving: '保存中...',
    error: '保存エラー',
  } as const
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
    <span
      class="statusbar-item save-status"
      class:saved={saveState.status === 'saved'}
      class:unsaved={saveState.status === 'unsaved'}
      class:error={saveState.status === 'error'}
      data-testid="statusbar-save-status"
    >
      {statusLabels[saveState.status]}
    </span>
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

  .save-status.saved { color: var(--color-success); }
  .save-status.unsaved { color: var(--color-warning); }
  .save-status.error { color: var(--color-error); }
</style>
