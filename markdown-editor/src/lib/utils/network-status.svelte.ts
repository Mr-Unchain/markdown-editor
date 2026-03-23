/**
 * Network status reactive state (LC-U4-11, R-U4-01)
 * Uses Svelte 5 $state for reactivity.
 */

let isOnline = $state<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

function handleOnline() {
  isOnline = true
}

function handleOffline() {
  isOnline = false
}

/** Initialize network status listeners */
export function initNetworkStatus(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

/** Cleanup network status listeners */
export function destroyNetworkStatus(): void {
  if (typeof window === 'undefined') return
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
}

/** Get current online status (reactive) */
export function getIsOnline(): boolean {
  return isOnline
}

/** Check actual connectivity by testing a platform connection */
export async function checkConnectivity(
  testFn: () => Promise<boolean>,
  timeoutMs = 15_000,
): Promise<boolean> {
  if (!isOnline) return false
  try {
    const result = await Promise.race([
      testFn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ])
    return result
  } catch {
    return false
  }
}
