<script lang="ts">
  import type { PlatformConnection } from '$lib/types/settings'
  import type { ConnectionTestResult } from '$lib/types/platform'

  interface ConnectionState extends PlatformConnection {
    connectionStatus: string
    lastTestResult?: ConnectionTestResult
  }

  let { connection, onSave, onRemove, onTest }: {
    connection: ConnectionState
    onSave: (creds: string) => void
    onRemove: () => void
    onTest: () => void
  } = $props()

  let isEditing = $state(false)
  let tokenInput = $state('')
  let repoInput = $state('')
  let branchInput = $state('main')

  function handleSave() {
    const [owner, name] = repoInput.split('/')
    const creds = JSON.stringify({
      type: connection.platformId,
      githubToken: tokenInput,
      repository: repoInput,
      repositoryOwner: owner ?? '',
      repositoryName: name ?? '',
      branch: branchInput,
    })
    onSave(creds)
    isEditing = false
    tokenInput = ''
  }

  function handleRemove() {
    onRemove()
    isEditing = false
  }

  const statusLabels: Record<string, string> = {
    unknown: '未テスト',
    connected: '接続済み',
    disconnected: '切断',
    testing: 'テスト中...',
  }
</script>

<div class="connection-card" data-testid="platform-connection-card-{connection.platformId}">
  <div class="card-header">
    <h3>{connection.displayName}</h3>
    <span class="status status-{connection.connectionStatus}">
      {statusLabels[connection.connectionStatus] ?? connection.connectionStatus}
    </span>
  </div>

  {#if isEditing}
    <div class="card-form">
      <label for="token-{connection.platformId}">GitHub Token</label>
      <input
        id="token-{connection.platformId}"
        type="password"
        bind:value={tokenInput}
        placeholder="ghp_..."
        data-testid="connection-token-input"
      />
      <label for="repo-{connection.platformId}">リポジトリ (owner/name)</label>
      <input
        id="repo-{connection.platformId}"
        bind:value={repoInput}
        placeholder="username/zenn-content"
        data-testid="connection-repo-input"
      />
      <label for="branch-{connection.platformId}">ブランチ</label>
      <input
        id="branch-{connection.platformId}"
        bind:value={branchInput}
        data-testid="connection-branch-input"
      />
      <div class="card-actions">
        <button onclick={handleSave} data-testid="connection-save-button">保存</button>
        <button onclick={() => isEditing = false}>キャンセル</button>
      </div>
    </div>
  {:else}
    <div class="card-actions">
      {#if connection.isConfigured}
        <button onclick={onTest} disabled={connection.connectionStatus === 'testing'} data-testid="connection-test-button">
          接続テスト
        </button>
        <button onclick={handleRemove} data-testid="connection-remove-button">削除</button>
      {/if}
      <button onclick={() => isEditing = true} data-testid="connection-edit-button">
        {connection.isConfigured ? '編集' : '設定'}
      </button>
    </div>
  {/if}
</div>

<style>
  .connection-card {
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 16px;
  }
  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .card-header h3 { margin: 0; }
  .status { font-size: 0.85em; padding: 2px 8px; border-radius: 12px; }
  .status-connected { background: #dcfce7; color: #166534; }
  .status-disconnected { background: #fee2e2; color: #991b1b; }
  .status-testing { background: #fef3c7; color: #92400e; }
  .status-unknown { background: #f3f4f6; color: #4b5563; }
  .card-form { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .card-form input { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; }
  .card-actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
