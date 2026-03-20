import type { SecureStorage } from './types'

export class TauriSecureStorage implements SecureStorage {
  private stronghold: Awaited<ReturnType<typeof import('@tauri-apps/plugin-stronghold')['Stronghold']['load']>> | null = null
  private store: any = null
  private initPromise: Promise<void> | null = null

  private async ensureInitialized(): Promise<void> {
    if (this.store) return
    if (this.initPromise) {
      await this.initPromise
      return
    }

    this.initPromise = (async () => {
      const { appDataDir } = await import('@tauri-apps/api/path')
      const { Stronghold } = await import('@tauri-apps/plugin-stronghold')
      const dataDir = await appDataDir()
      const vaultPath = `${dataDir}/vault.hold`
      const vaultPassword = 'markdown-editor-vault'

      this.stronghold = await Stronghold.load(vaultPath, vaultPassword)

      const clientName = 'credentials'
      try {
        const client = await this.stronghold.loadClient(clientName)
        this.store = client.getStore()
      } catch {
        const client = await this.stronghold.createClient(clientName)
        this.store = client.getStore()
      }
    })()

    await this.initPromise
  }

  async get(key: string): Promise<string | null> {
    await this.ensureInitialized()
    try {
      const data = await this.store.get(key)
      if (!data) return null
      return new TextDecoder().decode(new Uint8Array(data))
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureInitialized()
    const data = Array.from(new TextEncoder().encode(value))
    await this.store.insert(key, data)
    await this.stronghold!.save()
  }

  async remove(key: string): Promise<void> {
    await this.ensureInitialized()
    try {
      await this.store.remove(key)
      await this.stronghold!.save()
    } catch {
      // Key might not exist
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }
}
