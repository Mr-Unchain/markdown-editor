import type { PlatformConnection } from '$lib/types/settings'
import type { ConnectionTestResult } from '$lib/types/platform'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'

interface PlatformConnectionState extends PlatformConnection {
  connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'testing'
  lastTestResult?: ConnectionTestResult
}

let connections = $state<PlatformConnectionState[]>([])
let settingsManager: SettingsManager | null = null

/** Initialize platform store with settings manager */
export function initPlatformStore(sm: SettingsManager): void {
  settingsManager = sm
}

/** Get all connections (reactive) */
export function getConnections(): PlatformConnectionState[] {
  return connections
}

/** Get connection by platform ID */
export function getConnection(platformId: string): PlatformConnectionState | undefined {
  return connections.find((c) => c.platformId === platformId)
}

/** Check if credentials exist for a platform */
export function hasCredentials(platformId: string): boolean {
  const conn = connections.find((c) => c.platformId === platformId)
  return conn?.isConfigured ?? false
}

/** Check if a platform is connected */
export function isConnected(platformId: string): boolean {
  const conn = connections.find((c) => c.platformId === platformId)
  return conn?.connectionStatus === 'connected'
}

/**
 * Load connections from settings (P-U4-02: startup path).
 * Only checks token presence — does not read token values.
 */
export async function loadConnections(): Promise<void> {
  if (!settingsManager) return

  const config = settingsManager.get('platforms')
  if (!config?.connections) {
    // Default: register Zenn
    connections = [
      {
        platformId: 'zenn',
        displayName: 'Zenn',
        isConfigured: false,
        connectionStatus: 'unknown',
      },
    ]
    return
  }

  connections = config.connections.map((c) => ({
    ...c,
    connectionStatus: 'unknown' as const,
  }))

  // Check token presence for each connection (without reading values)
  for (const conn of connections) {
    const raw = await settingsManager.getPlatformCredentials(conn.platformId)
    conn.isConfigured = raw !== null
  }
}

/** Update connection status after a test */
export function updateConnectionStatus(
  platformId: string,
  result: ConnectionTestResult,
): void {
  const conn = connections.find((c) => c.platformId === platformId)
  if (conn) {
    conn.connectionStatus = result.success ? 'connected' : 'disconnected'
    conn.lastTestResult = result
  }
}

/** Set connection status to testing */
export function setConnectionTesting(platformId: string): void {
  const conn = connections.find((c) => c.platformId === platformId)
  if (conn) {
    conn.connectionStatus = 'testing'
  }
}

/**
 * Save platform credentials and update connection state.
 */
export async function saveCredentials(
  platformId: string,
  credentials: string,
): Promise<void> {
  if (!settingsManager) return

  await settingsManager.setPlatformCredentials(platformId, credentials)

  const conn = connections.find((c) => c.platformId === platformId)
  if (conn) {
    conn.isConfigured = true
    conn.connectionStatus = 'unknown'
  }
}

/**
 * Remove platform credentials and update connection state.
 */
export async function removeCredentials(platformId: string): Promise<void> {
  if (!settingsManager) return

  await settingsManager.removePlatformCredentials(platformId)

  const conn = connections.find((c) => c.platformId === platformId)
  if (conn) {
    conn.isConfigured = false
    conn.connectionStatus = 'disconnected'
  }
}
