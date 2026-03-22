<script lang="ts">
  interface Props {
    content: string
    onUpdate?: (content: string) => void
    readonly?: boolean
  }

  let { content, onUpdate, readonly = false }: Props = $props()

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement
    onUpdate?.(target.value)
  }
</script>

<div class="plaintext-editor" data-testid="plaintext-editor">
  <textarea
    class="plaintext-textarea"
    value={content}
    oninput={handleInput}
    {readonly}
    spellcheck="false"
    aria-label="プレーンテキストエディター"
    data-testid="plaintext-textarea"
  ></textarea>
</div>

<style>
  .plaintext-editor {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .plaintext-textarea {
    width: 100%;
    height: 100%;
    resize: none;
    border: none;
    outline: none;
    padding: 1rem;
    font-family: var(--font-mono, 'Consolas', 'Monaco', monospace);
    font-size: 0.875rem;
    line-height: 1.6;
    background: var(--color-bg);
    color: var(--color-text);
    tab-size: 2;
  }

  .plaintext-textarea:focus {
    outline: none;
  }
</style>
