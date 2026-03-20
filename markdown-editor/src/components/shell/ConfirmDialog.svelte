<script lang="ts">
  import { confirmState, handleConfirm, handleCancel } from '$lib/stores/confirm.svelte'

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel()
    }
  }
</script>

{#if confirmState.visible}
  <div
    class="confirm-overlay"
    data-testid="confirm-dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-label={confirmState.title}
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <div class="confirm-dialog" data-testid="confirm-dialog">
      <h3 class="confirm-title">{confirmState.title}</h3>
      <p class="confirm-message">{confirmState.message}</p>
      <div class="confirm-actions">
        <button
          class="confirm-btn cancel"
          onclick={handleCancel}
          data-testid="confirm-dialog-cancel"
        >
          {confirmState.cancelLabel}
        </button>
        <button
          class="confirm-btn confirm"
          onclick={handleConfirm}
          data-testid="confirm-dialog-confirm"
        >
          {confirmState.confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .confirm-dialog {
    background: var(--color-bg);
    border-radius: 8px;
    padding: 1.5rem;
    min-width: 320px;
    max-width: 480px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  .confirm-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
  .confirm-message { font-size: 0.875rem; opacity: 0.8; margin-bottom: 1.5rem; line-height: 1.5; }
  .confirm-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

  .confirm-btn {
    padding: 0.375rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .confirm-btn.cancel { background: var(--color-bg); color: var(--color-text); }
  .confirm-btn.confirm { background: var(--color-accent); color: white; border-color: var(--color-accent); }
  .confirm-btn:hover { opacity: 0.9; }
</style>
