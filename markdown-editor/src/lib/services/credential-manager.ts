import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import type { PlatformCredentials } from '$lib/types/settings'

/**
 * On-demand credential management (S-U4-01)
 * Fetches credentials from SecureStorage at operation start,
 * releases references after operation completion.
 */
export class CredentialManager {
  constructor(private readonly settingsManager: SettingsManager) {}

  /**
   * Execute a function with platform credentials.
   * Credentials are fetched on-demand and released (GC-eligible) after completion.
   */
  async withCredentials<T>(
    platformId: string,
    fn: (credentials: PlatformCredentials) => Promise<T>,
  ): Promise<T> {
    // Fetch from SecureStorage (on-demand)
    const raw = await this.settingsManager.getPlatformCredentials(platformId)
    if (!raw) {
      throw new Error(`認証情報が設定されていません: ${platformId}`)
    }

    let credentials: PlatformCredentials
    try {
      credentials = JSON.parse(raw) as PlatformCredentials
    } catch {
      throw new Error(`認証情報の解析に失敗しました: ${platformId}`)
    }

    // Execute with credentials — after fn completes, credentials goes out of scope → GC
    return fn(credentials)
  }

  /**
   * Check if credentials exist for a platform (without reading the actual values).
   */
  async hasCredentials(platformId: string): Promise<boolean> {
    const raw = await this.settingsManager.getPlatformCredentials(platformId)
    return raw !== null
  }
}
