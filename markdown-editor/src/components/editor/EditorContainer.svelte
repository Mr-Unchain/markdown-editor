<script lang="ts">
  let { element = $bindable() }: { element?: HTMLElement } = $props()
</script>

<div
  class="editor-content"
  role="textbox"
  aria-multiline="true"
  aria-label="エディター"
  bind:this={element}
  data-testid="editor-container"
>
  <!-- Tiptap がここに ProseMirror DOM をレンダリング -->
</div>
