<script lang="ts">
  import type { RecoveryFile } from '$lib/types/file-manager'

  interface Props {
    isOpen: boolean
    recoveryFiles: RecoveryFile[]
    onRecover: (file: RecoveryFile) => void
    onDiscard: () => void
    onClose: () => void
  }

  let { isOpen, recoveryFiles, onRecover, onDiscard, onClose }: Props = $props()

  let dialogEl: HTMLDialogElement | undefined = $state()

  $effect(() => {
    if (isOpen && dialogEl) {
      if (typeof dialogEl.showModal === 'function') dialogEl.showModal()
    } else if (!isOpen && dialogEl) {
      if (typeof dialogEl.close === 'function') dialogEl.close()
    }
  })

  function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString('ja-JP')
  }
</script>

<dialog
  bind:this={dialogEl}
  class="recovery-dialog"
  aria-label="未保存データの復旧"
  data-testid="recovery-dialog"
>
  <h2 class="dialog-title">未保存データが見つかりました</h2>
  <p class="dialog-message">
    前回のセッションで保存されなかったデータがあります。復旧しますか？
  </p>

  <ul class="recovery-list" data-testid="recovery-list">
    {#each recoveryFiles as file}
      <li class="recovery-item">
        <span class="recovery-path">{file.originalPath}</span>
        <span class="recovery-time">{formatTimestamp(file.timestamp)}</span>
        <button
          class="dialog-btn dialog-btn-small"
          onclick={() => onRecover(file)}
          data-testid="recovery-restore-btn"
        >復旧</button>
      </li>
    {/each}
  </ul>

  <div class="dialog-actions">
    <button
      class="dialog-btn dialog-btn-cancel"
      onclick={() => { onDiscard(); onClose() }}
      data-testid="recovery-discard"
    >すべて破棄</button>
    <button
      class="dialog-btn dialog-btn-primary"
      onclick={onClose}
      data-testid="recovery-close"
    >閉じる</button>
  </div>
</dialog>

<style>
  .recovery-dialog {
    border: none;
    border-radius: 8px;
    padding: 1.5rem;
    min-width: 400px;
    max-width: 560px;
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .recovery-dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  .dialog-title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  .dialog-message {
    font-size: 0.8125rem;
    opacity: 0.7;
    margin-bottom: 1rem;
  }

  .recovery-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .recovery-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.8125rem;
  }

  .recovery-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recovery-time {
    font-size: 0.75rem;
    opacity: 0.5;
    flex-shrink: 0;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .dialog-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .dialog-btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: var(--color-primary);
    color: white;
  }

  .dialog-btn-cancel {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .dialog-btn-primary {
    background: var(--color-primary);
    color: white;
  }
</style>
