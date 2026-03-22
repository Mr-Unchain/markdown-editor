<script lang="ts">
  import { validateFileName } from '$lib/utils/file-name-validator'

  interface Props {
    initialName: string
    parentPath: string
    onSubmit: (newName: string) => void
    onCancel: () => void
  }

  let { initialName, parentPath, onSubmit, onCancel }: Props = $props()

  let inputValue = $state(initialName)
  let errorMessage = $state('')
  let inputEl: HTMLInputElement | undefined = $state()

  $effect(() => {
    inputEl?.focus()
    inputEl?.select()
  })

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  function submit() {
    const result = validateFileName(inputValue, parentPath)
    if (!result.isValid) {
      errorMessage = result.message ?? 'バリデーションエラー'
      return
    }
    onSubmit(inputValue)
  }
</script>

<div class="inline-rename" data-testid="inline-rename">
  <input
    bind:this={inputEl}
    bind:value={inputValue}
    class="rename-input"
    class:error={errorMessage !== ''}
    onkeydown={handleKeydown}
    onblur={onCancel}
    aria-label="ファイル名を入力"
    data-testid="inline-rename-input"
  />
  {#if errorMessage}
    <span class="rename-error" role="alert" data-testid="inline-rename-error">
      {errorMessage}
    </span>
  {/if}
</div>

<style>
  .inline-rename {
    display: flex;
    flex-direction: column;
    padding: 0 0.5rem;
  }

  .rename-input {
    font-size: 0.8125rem;
    padding: 2px 4px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-input-bg, var(--color-bg));
    color: var(--color-text);
    outline: none;
    width: 100%;
  }

  .rename-input:focus {
    border-color: var(--color-focus);
  }

  .rename-input.error {
    border-color: var(--color-error);
  }

  .rename-error {
    font-size: 0.6875rem;
    color: var(--color-error);
    margin-top: 2px;
  }
</style>
