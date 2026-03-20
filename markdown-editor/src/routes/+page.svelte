<script lang="ts">
  // Main editor page — editor component will be mounted here in U2
</script>

<div class="editor-placeholder" data-testid="editor-mount-point">
  <p class="placeholder-text">Markdown Editor</p>
  <p class="placeholder-hint">エディターはU2で実装されます</p>
</div>

<style>
  .editor-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
    color: var(--color-text);
    opacity: 0.4;
  }

  .placeholder-text {
    font-size: 2rem;
    font-weight: 300;
  }

  .placeholder-hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
</style>
