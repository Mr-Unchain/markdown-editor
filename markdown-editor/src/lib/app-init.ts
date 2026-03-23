import { createFileSystemAdapter, isTauri } from './infrastructure/filesystem/factory'
import { TauriSecureStorage } from './infrastructure/secure-storage/tauri-secure-storage'
import { WebSecureStorage } from './infrastructure/secure-storage/web-secure-storage'
import { SettingsManager } from './core/settings/settings-manager.svelte'
import { WorkspaceService } from './services/workspace-service'
import { PlatformAdapterRegistry } from './integration/platform/platform-adapter-registry'
import { ExportService } from './integration/export/export-service'
import { ImageManager } from './core/image-manager/image-manager'
import { PublishService } from './services/publish'
import { initPlatformStore, loadConnections, hasCredentials, updateConnectionStatus } from './stores/platform-store.svelte'
import { initPublishStore } from './stores/publish-store.svelte'
import { initImageStore } from './stores/image-store.svelte'
import { initNetworkStatus } from './utils/network-status.svelte'
import type { FileSystemAdapter } from './infrastructure/filesystem/types'
import type { SecureStorage } from './infrastructure/secure-storage/types'

export interface AppContext {
  fs: FileSystemAdapter
  secureStorage: SecureStorage
  settingsManager: SettingsManager
  workspaceService: WorkspaceService
  registry: PlatformAdapterRegistry
  exportService: ExportService
  imageManager: ImageManager
  publishService: PublishService
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

  // Step 4: Initialize WorkspaceService (P-U3-04)
  const workspaceService = new WorkspaceService(fs, settingsManager)
  await workspaceService.initialize()

  // Step 5: Initialize U4 Platform Integration (P-U4-02: ≤140ms budget)
  const { registry, exportService, imageManager, publishService } =
    await initializePlatformIntegration(fs, settingsManager)

  appContext = {
    fs, secureStorage, settingsManager, workspaceService,
    registry, exportService, imageManager, publishService,
  }
  return appContext
}

/**
 * U4 Platform Integration initialization (P-U4-02).
 * Critical path: ≤140ms. Connection tests deferred to background.
 */
async function initializePlatformIntegration(
  fs: FileSystemAdapter,
  settingsManager: SettingsManager,
): Promise<{
  registry: PlatformAdapterRegistry
  exportService: ExportService
  imageManager: ImageManager
  publishService: PublishService
}> {
  // Critical path (~110ms)
  const registry = new PlatformAdapterRegistry()                      // [10ms]
  initPlatformStore(settingsManager)
  await loadConnections()                                             // [40ms]
  const exportService = new ExportService()                           // [10ms]
  const imageManager = new ImageManager(fs)                           // [10ms]
  const publishService = new PublishService(                          // [10ms]
    registry, exportService, imageManager, settingsManager, fs,
  )

  // Initialize stores
  initPublishStore(publishService)
  initImageStore(imageManager)
  initNetworkStatus()

  // Non-critical: background connection test (deferred)
  queueMicrotask(async () => {
    const platformIds = ['zenn']
    for (const platformId of platformIds) {
      if (hasCredentials(platformId)) {
        try {
          const result = await publishService.testConnection(platformId)
          updateConnectionStatus(platformId, result)
        } catch {
          // Connection test failure is non-blocking
        }
      }
    }
  })

  return { registry, exportService, imageManager, publishService }
}

export function getAppContext(): AppContext | null {
  return appContext
}

export function resetAppContext(): void {
  appContext = null
}
