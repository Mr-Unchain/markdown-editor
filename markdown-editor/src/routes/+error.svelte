<script lang="ts">
  import { page } from '$app/state'
</script>

<div class="error-page">
  <h1>エラーが発生しました</h1>
  <p class="error-status">{page.status}</p>
  <p class="error-message">{page.error?.message ?? '不明なエラー'}</p>
  <button onclick={() => location.reload()}>再読み込み</button>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #333;
    padding: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .error-status {
    font-size: 3rem;
    font-weight: bold;
    color: #e53e3e;
    margin: 0.5rem 0;
  }

  .error-message {
    color: #666;
    max-width: 600px;
    word-break: break-word;
    margin-bottom: 1.5rem;
  }

  button {
    padding: 0.5rem 1.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background: #f5f5f5;
  }
</style>
