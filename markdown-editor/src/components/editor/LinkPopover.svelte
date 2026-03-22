<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { LinkEditorState } from '$lib/types/link-editor'
  import { validateLinkUrl } from '$lib/utils/link-validator'

  let {
    editor,
    linkState,
    onClose,
  }: {
    editor: Editor | null
    linkState: LinkEditorState
    onClose: () => void
  } = $props()

  let urlInput = $state(linkState.url)
  let openInNewTab = $state(linkState.openInNewTab)
  let validationError = $state('')

  function handleSubmit() {
    if (!editor) return

    if (!urlInput.trim()) {
      editor.chain().focus().unsetLink().run()
      onClose()
      return
    }

    const validation = validateLinkUrl(urlInput)
    if (!validation.valid) {
      validationError = '無効なURLです'
      return
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: validation.sanitized,
        target: openInNewTab ? '_blank' : null,
      })
      .run()

    onClose()
  }

  function handleRemove() {
    editor?.chain().focus().unsetLink().run()
    onClose()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }
</script>

{#if linkState.isOpen}
  <div
    class="link-popover"
    role="dialog"
    aria-label="リンク編集"
    aria-modal="true"
    onkeydown={handleKeydown}
    data-testid="link-popover"
  >
    <div class="link-popover-content">
      <label class="link-label">
        URL
        <input
          type="url"
          class="link-input"
          bind:value={urlInput}
          placeholder="https://example.com"
          data-testid="link-url-input"
        />
      </label>
      {#if validationError}
        <span class="link-error" role="alert">{validationError}</span>
      {/if}
      <label class="link-checkbox">
        <input type="checkbox" bind:checked={openInNewTab} data-testid="link-newtab-checkbox" />
        新しいタブで開く
      </label>
      <div class="link-actions">
        <button
          class="link-btn link-btn-primary"
          onclick={handleSubmit}
          data-testid="link-submit"
        >
          適用
        </button>
        {#if linkState.mode === 'edit'}
          <button
            class="link-btn link-btn-danger"
            onclick={handleRemove}
            data-testid="link-remove"
          >
            削除
          </button>
        {/if}
        <button
          class="link-btn"
          onclick={onClose}
          data-testid="link-cancel"
        >
          キャンセル
        </button>
      </div>
    </div>
  </div>
{/if}
