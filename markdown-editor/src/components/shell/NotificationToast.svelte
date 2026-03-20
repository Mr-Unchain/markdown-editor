<script lang="ts">
  import { notificationState, dismissNotification } from '$lib/stores/notifications.svelte'

  const typeIcons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  } as const
</script>

<div class="notification-container" data-testid="notification-container" aria-live="polite">
  {#each notificationState.list as notification (notification.id)}
    <div
      class="notification notification-{notification.type}"
      data-testid="notification-toast"
      role="alert"
    >
      <span class="notification-icon">{typeIcons[notification.type]}</span>
      <span class="notification-message">{notification.message}</span>
      <button
        class="notification-dismiss"
        onclick={() => dismissNotification(notification.id)}
        aria-label="通知を閉じる"
        data-testid="notification-dismiss"
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    bottom: calc(var(--statusbar-height) + 0.5rem);
    right: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
    pointer-events: none;
  }

  .notification {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: toast-in 200ms ease;
    max-width: 360px;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(0.5rem); }
    to { opacity: 1; transform: translateY(0); }
  }

  .notification-info { background: var(--color-info); color: white; }
  .notification-success { background: var(--color-success); color: white; }
  .notification-warning { background: var(--color-warning); color: #1a1a1a; }
  .notification-error { background: var(--color-error); color: white; }

  .notification-icon { flex-shrink: 0; font-weight: bold; }
  .notification-message { flex: 1; }

  .notification-dismiss {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0 0.25rem;
    font-size: 1rem;
    opacity: 0.8;
    flex-shrink: 0;
  }

  .notification-dismiss:hover { opacity: 1; }
</style>
