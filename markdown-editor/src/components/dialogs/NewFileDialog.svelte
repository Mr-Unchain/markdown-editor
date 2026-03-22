<script lang="ts">
  import { createFocusTrap, type FocusTrap } from '$lib/utils/focus-trap'
  import { validateFileName } from '$lib/utils/file-name-validator'

  interface Props {
    isOpen: boolean
    parentPath: string
    mode: 'file' | 'folder'
    onSubmit: (name: string) => void
    onClose: () => void
  }

  let { isOpen, parentPath, mode, onSubmit, onClose }: Props = $props()

  let inputValue = $state('')
  let errorMessage = $state('')
  let dialogEl: HTMLDialogElement | undefined = $state()
  let focusTrap: FocusTrap | null = $state(null)

  $effect(() => {
    if (isOpen && dialogEl) {
      if (typeof dialogEl.showModal === 'function') dialogEl.showModal()
      focusTrap = createFocusTrap(dialogEl)
      focusTrap.activate()
      inputValue = ''
      errorMessage = ''
    } else if (!isOpen && dialogEl) {
      focusTrap?.deactivate()
      if (typeof dialogEl.close === 'function') dialogEl.close()
    }
  })

  function handleSubmit() {
    const result = validateFileName(inputValue, parentPath)
    if (!result.isValid) {
      errorMessage = result.message ?? 'バリデーションエラー'
      return
    }
    onSubmit(inputValue)
    onClose()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  class="new-file-dialog"
  aria-label={mode === 'file' ? '新規ファイル作成' : '新規フォルダ作成'}
  onkeydown={handleKeydown}
  data-testid="new-file-dialog"
>
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit() }}>
    <h2 class="dialog-title">
      {mode === 'file' ? '新規ファイル' : '新規フォルダ'}
    </h2>

    <div class="dialog-body">
      <label for="new-file-name" class="dialog-label">
        {mode === 'file' ? 'ファイル名' : 'フォルダ名'}
      </label>
      <input
        id="new-file-name"
        type="text"
        class="dialog-input"
        class:error={errorMessage !== ''}
        bind:value={inputValue}
        placeholder={mode === 'file' ? 'document.md' : 'folder-name'}
        data-testid="new-file-name-input"
      />
      {#if errorMessage}
        <span class="dialog-error" role="alert" data-testid="new-file-error">
          {errorMessage}
        </span>
      {/if}
    </div>

    <div class="dialog-actions">
      <button
        type="button"
        class="dialog-btn dialog-btn-cancel"
        onclick={onClose}
        data-testid="new-file-cancel"
      >キャンセル</button>
      <button
        type="submit"
        class="dialog-btn dialog-btn-primary"
        data-testid="new-file-submit"
      >作成</button>
    </div>
  </form>
</dialog>

<style>
  .new-file-dialog {
    border: none;
    border-radius: 8px;
    padding: 1.5rem;
    min-width: 320px;
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .new-file-dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  .dialog-title {
    margin: 0 0 1rem;
    font-size: 1rem;
  }

  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .dialog-label {
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .dialog-input {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--color-input-bg, var(--color-bg));
    color: var(--color-text);
  }

  .dialog-input:focus {
    outline: none;
    border-color: var(--color-focus);
  }

  .dialog-input.error {
    border-color: var(--color-error);
  }

  .dialog-error {
    font-size: 0.75rem;
    color: var(--color-error);
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

  .dialog-btn-cancel {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .dialog-btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .dialog-btn:hover {
    opacity: 0.9;
  }
</style>
