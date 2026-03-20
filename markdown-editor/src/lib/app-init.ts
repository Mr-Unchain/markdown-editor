import { createFileSystemAdapter, isTauri } from './infrastructure/filesystem/factory'
import { TauriSecureStorage } from './infrastructure/secure-storage/tauri-secure-storage'
import { WebSecureStorage } from './infrastructure/secure-storage/web-secure-storage'
import { SettingsManager } from './core/settings/settings-manager.svelte'
import type { FileSystemAdapter } from './infrastructure/filesystem/types'
import type { SecureStorage } from './infrastructure/secure-storage/types'

export interface AppContext {
  fs: FileSystemAdapter
  secureStorage: SecureStorage
  settingsManager: SettingsManager
}

let appContext: AppContext | null = null

export async function initializeApp(): Promise<AppContext> {
  if (appContext) return appContext

  // Step 1: Create FileSystemAdapter (< 10ms)
  const fs = createFileSystemAdapter()

  // Step 2: Create SecureStorage (lazy init — actual init deferred)
  const secureStorage = isTauri() ? new TauriSecureStorage() : new WebSecureStorage()

  // Step 3: Initialize SettingsManager (< 50ms)
  const settingsManager = new SettingsManager()
  let appDataDir: string | undefined
  if (isTauri()) {
    const { appDataDir: getAppDataDir } = await import('@tauri-apps/api/path')
    appDataDir = await getAppDataDir()
  }
  await settingsManager.initialize(fs, secureStorage, appDataDir)

  appContext = { fs, secureStorage, settingsManager }
  return appContext
}

export function getAppContext(): AppContext | null {
  return appContext
}

export function resetAppContext(): void {
  appContext = null
}
