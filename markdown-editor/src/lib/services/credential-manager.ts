import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import { notify } from '$lib/stores/notifications.svelte'
import type { PlatformCredentials } from '$lib/types/settings'
import { SecureStorageRecoveryError } from '$lib/infrastructure/secure-storage/tauri-secure-storage'

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
    let raw: string | null
    try {
      raw = await this.settingsManager.getPlatformCredentials(platformId)
    } catch (error) {
      if (error instanceof SecureStorageRecoveryError) {
        notify('error', '認証情報ストアの再認証が必要です。設定画面から再登録してください。')
      }
      throw error
    }

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
