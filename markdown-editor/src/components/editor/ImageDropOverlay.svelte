<script lang="ts">
  import { handleImageDrop, getIsProcessing } from '$lib/stores/image-store.svelte'

  let { filePath = '', onInsert }: {
    filePath: string
    onInsert: (markdownRef: string) => void
  } = $props()

  let isDragging = $state(false)

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging = false

    const results = await handleImageDrop(event, filePath)
    for (const result of results) {
      if (result.success && result.markdownRef) {
        onInsert(result.markdownRef)
      }
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer?.types.includes('Files')) {
      isDragging = true
    }
  }

  function handleDragLeave() {
    isDragging = false
  }
</script>

<div
  class="drop-zone"
  class:dragging={isDragging}
  class:processing={getIsProcessing()}
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  role="region"
  aria-label="画像ドロップエリア"
  data-testid="image-drop-overlay"
>
  {#if isDragging}
    <div class="overlay">
      <p>画像をドロップして挿入</p>
    </div>
  {/if}

  {#if getIsProcessing()}
    <div class="overlay processing-overlay">
      <p>画像を処理中...</p>
    </div>
  {/if}

  <slot />
</div>

<style>
  .drop-zone { position: relative; }
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    border: 2px dashed var(--primary-color, #3b82f6);
    border-radius: 8px;
    z-index: 10;
    pointer-events: none;
  }
  .processing-overlay { background: rgba(0, 0, 0, 0.05); border-style: solid; }
</style>
