<script lang="ts">
  import type { PublishProgress, PublishStep } from '$lib/types/platform'

  let { progress, onCancel }: { progress: PublishProgress; onCancel: () => void } = $props()

  const STEP_LABELS: Record<PublishStep, string> = {
    'validate': 'バリデーション',
    'export': 'エクスポート',
    'upload-images': '画像アップロード',
    'replace-urls': 'URL置換',
    'publish': '投稿',
    'update-frontmatter': 'Frontmatter更新',
    'complete': '完了',
  }

  let percentage = $derived(Math.round((progress.completedSteps / progress.totalSteps) * 100))
</script>

<div class="progress-container" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="投稿進捗" data-testid="publish-progress">
  <div class="progress-bar">
    <div class="progress-fill" style="width: {percentage}%"></div>
  </div>

  <p class="step-label">{STEP_LABELS[progress.currentStep]} ({progress.completedSteps}/{progress.totalSteps})</p>

  {#if progress.imageProgress}
    <p class="image-progress">
      画像: {progress.imageProgress.completed}/{progress.imageProgress.total}
      {#if progress.imageProgress.currentFile}
        — {progress.imageProgress.currentFile.split('/').pop()}
      {/if}
    </p>
  {/if}

  {#if progress.status === 'running'}
    <button onclick={onCancel} data-testid="publish-cancel-progress-button">
      キャンセル
    </button>
  {/if}

  {#if progress.status === 'completed'}
    <p class="success">投稿が完了しました</p>
  {/if}

  {#if progress.status === 'failed'}
    <p class="error">投稿に失敗しました</p>
  {/if}
</div>

<style>
  .progress-container { padding: 16px 0; }
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--progress-bg, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--primary-color, #3b82f6);
    transition: width 200ms ease;
  }
  .step-label { margin-top: 8px; font-weight: 500; }
  .image-progress { font-size: 0.85em; color: var(--text-muted, #666); }
  .success { color: var(--success-color, #16a34a); }
  .error { color: var(--error-color, #dc2626); }
</style>
