import type { AppSettings } from '$lib/types/settings'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import type { SecureStorage } from '$lib/infrastructure/secure-storage/types'
import { DEFAULT_SETTINGS } from './defaults'
import { mergeWithDefaults } from './merge'
import { isTauri } from '$lib/infrastructure/filesystem/factory'

const SETTINGS_FILE = 'settings.json'
const SETTINGS_STORAGE_KEY = 'markdown-editor-settings'
const DEBOUNCE_MS = 500

export class SettingsManager {
  current: AppSettings = $state({ ...DEFAULT_SETTINGS })
  private writeTimer: ReturnType<typeof setTimeout> | null = null
  private settingsPath: string | null = null
  private fs: FileSystemAdapter | null = null
  private secureStorage: SecureStorage | null = null

  async initialize(
    fs: FileSystemAdapter,
    secureStorage: SecureStorage,
    appDataDir?: string,
  ): Promise<void> {
    this.fs = fs
    this.secureStorage = secureStorage

    if (isTauri() && appDataDir) {
      this.settingsPath = `${appDataDir}/${SETTINGS_FILE}`
      await this.loadFromFile()
    } else {
      this.loadFromLocalStorage()
    }
  }

  private async loadFromFile(): Promise<void> {
    if (!this.fs || !this.settingsPath) return

    try {
      const exists = await this.fs.exists(this.settingsPath)
      if (!exists) {
        await this.saveToFile()
        return
      }

      const raw = await this.fs.readFile(this.settingsPath)
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      const settings = mergeWithDefaults(parsed)
      Object.assign(this.current, settings)
    } catch {
      Object.assign(this.current, DEFAULT_SETTINGS)
      await this.saveToFile()
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<AppSettings>
      const settings = mergeWithDefaults(parsed)
      Object.assign(this.current, settings)
    } catch {
      Object.assign(this.current, DEFAULT_SETTINGS)
    }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.current[key]
  }

  getAll(): AppSettings {
    return this.current
  }

  async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    this.current[key] = value
    this.scheduleSave()
  }

  async setEditor<K extends keyof AppSettings['editor']>(
    key: K,
    value: AppSettings['editor'][K],
  ): Promise<void> {
    this.current.editor[key] = value
    this.scheduleSave()
  }

  async getPlatformCredentials(platformId: string): Promise<string | null> {
    if (!this.secureStorage) return null
    return this.secureStorage.get(`platform:${platformId}`)
  }

  async setPlatformCredentials(platformId: string, credentials: string): Promise<void> {
    if (!this.secureStorage) return
    await this.secureStorage.set(`platform:${platformId}`, credentials)
  }

  async removePlatformCredentials(platformId: string): Promise<void> {
    if (!this.secureStorage) return
    await this.secureStorage.remove(`platform:${platformId}`)
  }

  async flush(): Promise<void> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      this.writeTimer = null
    }
    await this.save()
  }

  async onAppClose(): Promise<void> {
    await this.flush()
  }

  private scheduleSave(): void {
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => this.save(), DEBOUNCE_MS)
  }

  private async save(): Promise<void> {
    if (isTauri() && this.settingsPath) {
      await this.saveToFile()
    } else {
      this.saveToLocalStorage()
    }
  }

  private async saveToFile(): Promise<void> {
    if (!this.fs || !this.settingsPath) return
    const dir = this.settingsPath.substring(0, this.settingsPath.lastIndexOf('/'))
    await this.fs.mkdir(dir)
    await this.fs.writeFile(this.settingsPath, JSON.stringify(this.current, null, 2))
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.current))
  }
}
