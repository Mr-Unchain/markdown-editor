<script lang="ts">
  import { getConnections, saveCredentials, removeCredentials, setConnectionTesting, updateConnectionStatus } from '$lib/stores/platform-store.svelte'
  import PlatformConnectionCard from './PlatformConnectionCard.svelte'
  import type { PublishService } from '$lib/services/publish'

  let { open = $bindable(false), publishService }: {
    open: boolean
    publishService: PublishService | null
  } = $props()

  let dialogEl: HTMLDialogElement | undefined = $state()

  $effect(() => {
    if (open && dialogEl) dialogEl.showModal()
    else if (!open && dialogEl) dialogEl.close()
  })

  function handleClose() {
    open = false
  }

  async function handleTestConnection(platformId: string) {
    if (!publishService) return
    setConnectionTesting(platformId)
    try {
      const result = await publishService.testConnection(platformId)
      updateConnectionStatus(platformId, result)
    } catch {
      updateConnectionStatus(platformId, { success: false, message: '接続テストに失敗しました' })
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  role="dialog"
  aria-modal="true"
  aria-labelledby="platform-settings-title"
  onclose={handleClose}
  data-testid="platform-settings-dialog"
>
  <h2 id="platform-settings-title">プラットフォーム接続設定</h2>

  <div class="connections-list">
    {#each getConnections() as connection (connection.platformId)}
      <PlatformConnectionCard
        {connection}
        onSave={(creds) => saveCredentials(connection.platformId, creds)}
        onRemove={() => removeCredentials(connection.platformId)}
        onTest={() => handleTestConnection(connection.platformId)}
      />
    {/each}
  </div>

  <div class="actions">
    <button onclick={handleClose} data-testid="platform-settings-close-button">閉じる</button>
  </div>
</dialog>

<style>
  dialog {
    max-width: 560px;
    width: 90%;
    border-radius: 8px;
    border: 1px solid var(--border-color, #e0e0e0);
    padding: 24px;
  }
  dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
  .connections-list { display: flex; flex-direction: column; gap: 16px; margin: 16px 0; }
  .actions { display: flex; justify-content: flex-end; }
</style>
