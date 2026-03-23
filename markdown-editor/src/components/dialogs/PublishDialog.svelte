<script lang="ts">
  import { getPublishProgress, startPublish, cancelPublish, isPublishing } from '$lib/stores/publish-store.svelte'
  import { getConnections, hasCredentials } from '$lib/stores/platform-store.svelte'
  import { getIsOnline } from '$lib/utils/network-status.svelte'
  import { formatErrorMessage } from '$lib/utils/error-messages'
  import { notify } from '$lib/stores/notifications.svelte'
  import PublishProgressIndicator from './PublishProgressIndicator.svelte'
  import type { ArticlePayload, LocalImageRef } from '$lib/types/platform'

  let { open = $bindable(false), filePath = '', images = [] as LocalImageRef[] }: {
    open: boolean
    filePath: string
    images: LocalImageRef[]
  } = $props()

  let dialogEl: HTMLDialogElement | undefined = $state()
  let title = $state('')
  let tagsInput = $state('')
  let slug = $state('')
  let emoji = $state('📝')
  let articleType = $state<'tech' | 'idea'>('tech')
  let publishAs = $state<'draft' | 'public'>('draft')
  let selectedPlatform = $state('zenn')
  let showAdvanced = $state(false)

  let isValid = $derived(title.trim().length > 0)
  let canPublish = $derived(
    isValid &&
    !isPublishing() &&
    getIsOnline() &&
    hasCredentials(selectedPlatform)
  )

  $effect(() => {
    if (open && dialogEl) {
      dialogEl.showModal()
    } else if (!open && dialogEl) {
      dialogEl.close()
    }
  })

  function handleClose() {
    open = false
  }

  async function handleSubmit() {
    if (!canPublish) return

    const payload: ArticlePayload = {
      title: title.trim(),
      body: '', // Will be populated by pipeline from editor content
      bodyFormat: 'markdown',
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
      images,
      slug: slug.trim() || undefined,
      emoji,
      articleType,
      published: publishAs === 'public',
    }

    try {
      const result = await startPublish(selectedPlatform, payload, filePath)
      if (result.success) {
        notify('success', `記事を${publishAs === 'draft' ? '下書き保存' : '公開'}しました`)
        handleClose()
      } else {
        notify('error', result.error ?? '投稿に失敗しました')
      }
    } catch (error) {
      if (error instanceof Error) {
        notify('error', formatErrorMessage(error))
      }
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  role="dialog"
  aria-modal="true"
  aria-labelledby="publish-dialog-title"
  onclose={handleClose}
  data-testid="publish-dialog"
>
  <h2 id="publish-dialog-title">記事を投稿</h2>

  {#if isPublishing()}
    <PublishProgressIndicator progress={getPublishProgress()} onCancel={cancelPublish} />
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div class="form-group">
        <label for="publish-title">タイトル</label>
        <input
          id="publish-title"
          bind:value={title}
          required
          aria-required="true"
          data-testid="publish-title-input"
        />
      </div>

      <div class="form-group">
        <label for="publish-platform">プラットフォーム</label>
        <select id="publish-platform" bind:value={selectedPlatform} data-testid="publish-platform-select">
          {#each getConnections() as conn}
            <option value={conn.platformId}>{conn.displayName}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="publish-tags">トピック</label>
        <input
          id="publish-tags"
          bind:value={tagsInput}
          aria-describedby="tags-help"
          placeholder="svelte, typescript"
          data-testid="publish-tags-input"
        />
        <span id="tags-help" class="help-text">カンマ区切りで最大5個</span>
      </div>

      <div class="form-group">
        <label for="publish-as">投稿形式</label>
        <select id="publish-as" bind:value={publishAs} data-testid="publish-as-select">
          <option value="draft">下書き</option>
          <option value="public">公開</option>
        </select>
      </div>

      {#if showAdvanced}
        <div class="advanced-section">
          <div class="form-group">
            <label for="publish-slug">Slug</label>
            <input id="publish-slug" bind:value={slug} placeholder="auto-generated" data-testid="publish-slug-input" />
          </div>
          <div class="form-group">
            <label for="publish-emoji">Emoji</label>
            <input id="publish-emoji" bind:value={emoji} data-testid="publish-emoji-input" />
          </div>
          <div class="form-group">
            <label for="publish-type">記事タイプ</label>
            <select id="publish-type" bind:value={articleType} data-testid="publish-type-select">
              <option value="tech">Tech</option>
              <option value="idea">Idea</option>
            </select>
          </div>
        </div>
      {/if}

      <button type="button" class="toggle-advanced" onclick={() => showAdvanced = !showAdvanced}>
        {showAdvanced ? '▲ 詳細設定を閉じる' : '▼ 詳細設定'}
      </button>

      {#if !getIsOnline()}
        <p class="warning" role="alert">オフラインです。投稿にはインターネット接続が必要です。</p>
      {/if}

      {#if !hasCredentials(selectedPlatform)}
        <p class="warning" role="alert">認証情報が設定されていません。設定画面でトークンを登録してください。</p>
      {/if}

      <div role="group" aria-label="アクション" class="actions">
        <button type="button" onclick={handleClose} data-testid="publish-cancel-button">
          キャンセル
        </button>
        <button type="submit" disabled={!canPublish} data-testid="publish-submit-button">
          {publishAs === 'draft' ? '下書き保存' : '公開'}
        </button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  dialog {
    max-width: 480px;
    width: 90%;
    border-radius: 8px;
    border: 1px solid var(--border-color, #e0e0e0);
    padding: 24px;
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
  .form-group {
    margin-bottom: 16px;
  }
  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
  }
  input, select {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
  }
  .help-text {
    font-size: 0.85em;
    color: var(--text-muted, #666);
  }
  .toggle-advanced {
    background: none;
    border: none;
    color: var(--text-muted, #666);
    cursor: pointer;
    margin-bottom: 16px;
  }
  .warning {
    color: var(--warning-color, #c57600);
    padding: 8px;
    border-radius: 4px;
    background: var(--warning-bg, #fff8e6);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .actions button[type="submit"] {
    background: var(--primary-color, #3b82f6);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  .actions button[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
