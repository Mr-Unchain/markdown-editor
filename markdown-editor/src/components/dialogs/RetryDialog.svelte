<script lang="ts">
  let { open = $bindable(false), title = '', message = '', countdown = 0, actions = [] as Array<{ label: string; value: string }> }: {
    open: boolean
    title: string
    message: string
    countdown: number
    actions: Array<{ label: string; value: string }>
  } = $props()

  let dialogEl: HTMLDialogElement | undefined = $state()
  let remainingSeconds = $state(countdown)
  let resolve: ((value: string) => void) | null = null

  $effect(() => {
    if (open && dialogEl) {
      dialogEl.showModal()
      remainingSeconds = countdown
    } else if (!open && dialogEl) {
      dialogEl.close()
    }
  })

  $effect(() => {
    if (remainingSeconds > 0 && open) {
      const timer = setTimeout(() => { remainingSeconds-- }, 1000)
      return () => clearTimeout(timer)
    }
  })

  function handleAction(value: string) {
    open = false
    resolve?.(value)
  }
</script>

<dialog
  bind:this={dialogEl}
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="retry-dialog-title"
  data-testid="retry-dialog"
>
  <h3 id="retry-dialog-title">{title}</h3>
  <p>{message}</p>

  {#if remainingSeconds > 0}
    <p class="countdown" aria-live="polite">{remainingSeconds}秒後に再試行可能</p>
  {/if}

  <div class="actions">
    {#each actions as action}
      <button
        onclick={() => handleAction(action.value)}
        data-testid="retry-action-{action.value}"
      >
        {action.label}
      </button>
    {/each}
  </div>
</dialog>

<style>
  dialog { max-width: 400px; width: 90%; border-radius: 8px; padding: 24px; border: 1px solid var(--border-color, #e0e0e0); }
  dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
  .countdown { font-weight: 500; color: var(--warning-color, #c57600); }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
</style>
