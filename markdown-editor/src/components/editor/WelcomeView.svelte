<script lang="ts">
  interface Props {
    onOpenWorkspace?: () => void
  }

  let { onOpenWorkspace }: Props = $props()
</script>

<div class="welcome-view" data-testid="welcome-view">
  <div class="welcome-content">
    <h1 class="welcome-title">Markdown Editor</h1>
    <p class="welcome-subtitle">ワークスペースを開いて始めましょう</p>

    <div class="welcome-actions">
      <button
        class="welcome-btn"
        onclick={onOpenWorkspace}
        data-testid="welcome-open-workspace"
      >
        フォルダを開く
      </button>
    </div>

    <div class="welcome-shortcuts">
      <h3 class="shortcuts-title">キーボードショートカット</h3>
      <dl class="shortcuts-list">
        <div class="shortcut-item">
          <dt>Ctrl + S</dt>
          <dd>ファイルを保存</dd>
        </div>
        <div class="shortcut-item">
          <dt>Ctrl + \</dt>
          <dd>サイドバーの表示/非表示</dd>
        </div>
        <div class="shortcut-item">
          <dt>Ctrl + W</dt>
          <dd>タブを閉じる</dd>
        </div>
      </dl>
    </div>
  </div>
</div>

<style>
  .welcome-view {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
  }

  .welcome-content {
    text-align: center;
    max-width: 400px;
  }

  .welcome-title {
    font-size: 1.75rem;
    font-weight: 300;
    margin: 0 0 0.5rem;
    color: var(--color-text);
  }

  .welcome-subtitle {
    font-size: 0.875rem;
    opacity: 0.6;
    margin: 0 0 2rem;
  }

  .welcome-actions {
    margin-bottom: 2.5rem;
  }

  .welcome-btn {
    padding: 0.625rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .welcome-btn:hover {
    opacity: 0.9;
  }

  .welcome-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .shortcuts-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.4;
    margin-bottom: 0.75rem;
  }

  .shortcuts-list {
    margin: 0;
    text-align: left;
  }

  .shortcut-item {
    display: flex;
    justify-content: space-between;
    padding: 0.375rem 0;
    font-size: 0.8125rem;
  }

  .shortcut-item dt {
    font-family: var(--font-mono, monospace);
    font-size: 0.75rem;
    background: var(--color-hover);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
  }

  .shortcut-item dd {
    margin: 0;
    opacity: 0.6;
  }
</style>
