<script lang="ts">
  import { notify } from '$lib/stores/notifications.svelte'
  import type { ExportService } from '$lib/integration/export/export-service'

  let { exportService, markdownContent = '', editorHTML = '' }: {
    exportService: ExportService | null
    markdownContent: string
    editorHTML: string
  } = $props()

  let isOpen = $state(false)

  async function handleExport(format: 'markdown' | 'html', action: 'copy' | 'download') {
    if (!exportService) return
    isOpen = false

    try {
      if (format === 'markdown' && action === 'copy') {
        await exportService.copyToClipboardAsText(markdownContent)
        notify('success', 'Markdownをコピーしました')
      } else if (format === 'html' && action === 'copy') {
        const html = await exportService.toHTML(editorHTML)
        await exportService.copyToClipboardAsRichText(html, markdownContent)
        notify('success', 'HTMLをコピーしました')
      } else if (format === 'markdown' && action === 'download') {
        await exportService.downloadAsFile(markdownContent, 'export.md')
        notify('success', 'Markdownをダウンロードしました')
      } else if (format === 'html' && action === 'download') {
        const html = await exportService.toHTML(editorHTML)
        await exportService.downloadAsFile(html, 'export.html')
        notify('success', 'HTMLをダウンロードしました')
      }
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'エクスポートに失敗しました')
    }
  }
</script>

<div class="export-menu" data-testid="export-menu">
  <button
    onclick={() => isOpen = !isOpen}
    aria-expanded={isOpen}
    aria-haspopup="menu"
    data-testid="export-menu-trigger"
  >
    エクスポート
  </button>

  {#if isOpen}
    <div class="dropdown" role="menu">
      <button role="menuitem" onclick={() => handleExport('markdown', 'copy')} data-testid="export-md-copy">
        Markdownをコピー
      </button>
      <button role="menuitem" onclick={() => handleExport('html', 'copy')} data-testid="export-html-copy">
        HTMLをコピー
      </button>
      <hr />
      <button role="menuitem" onclick={() => handleExport('markdown', 'download')} data-testid="export-md-download">
        Markdownをダウンロード
      </button>
      <button role="menuitem" onclick={() => handleExport('html', 'download')} data-testid="export-html-download">
        HTMLをダウンロード
      </button>
    </div>
  {/if}
</div>

<style>
  .export-menu { position: relative; }
  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 4px;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 100;
  }
  .dropdown button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    background: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .dropdown button:hover { background: var(--hover-bg, #f3f4f6); }
  .dropdown hr { margin: 4px 0; border: none; border-top: 1px solid var(--border-color, #e0e0e0); }
</style>
