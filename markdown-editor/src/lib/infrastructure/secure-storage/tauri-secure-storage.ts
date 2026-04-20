import { notify } from '$lib/stores/notifications.svelte'
import type { SecureStorage } from './types'

const LEGACY_VAULT_PASSWORD = 'markdown-editor-vault'
const PRIMARY_VAULT_FILENAME = 'vault.v2.hold'
const LEGACY_VAULT_FILENAME = 'vault.hold'
const CLIENT_NAME = 'credentials'
const MIGRATION_KEYS = ['platform:zenn', 'platform:note', 'platform:microcms', 'platform:contentful']

interface VaultPasswordPayload {
  password: string
}

export class SecureStorageRecoveryError extends Error {
  constructor(message = 'Secure storage recovery required') {
    super(message)
    this.name = 'SecureStorageRecoveryError'
  }
}

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
      const { invoke } = await import('@tauri-apps/api/core')
      const { Stronghold } = await import('@tauri-apps/plugin-stronghold')
      const dataDir = await appDataDir()
      const primaryVaultPath = `${dataDir}/${PRIMARY_VAULT_FILENAME}`
      const legacyVaultPath = `${dataDir}/${LEGACY_VAULT_FILENAME}`
      const { password } = await invoke<VaultPasswordPayload>('get_or_create_vault_password')

      try {
        this.stronghold = await Stronghold.load(primaryVaultPath, password)
      } catch (primaryError) {
        notify('warning', 'セキュアストレージの再接続を試行します。')
        const legacyStronghold = await this.tryLoadLegacyStronghold(Stronghold, legacyVaultPath)
        if (!legacyStronghold) {
          notify('error', '認証情報ストレージを復旧できませんでした。再認証が必要です。')
          throw new SecureStorageRecoveryError(String(primaryError))
        }

        await this.migrateLegacyCredentials(Stronghold, legacyStronghold, primaryVaultPath, password)
        this.stronghold = await Stronghold.load(primaryVaultPath, password)
      }

      const clientName = CLIENT_NAME
      try {
        const client = await this.stronghold.loadClient(clientName)
        this.store = client.getStore()
      } catch {
        const client = await this.stronghold.createClient(clientName)
        this.store = client.getStore()
      }
    })().catch((error) => {
      this.initPromise = null
      throw error
    })

    await this.initPromise
  }

  private async tryLoadLegacyStronghold(Stronghold: any, legacyVaultPath: string): Promise<any | null> {
    try {
      return await Stronghold.load(legacyVaultPath, LEGACY_VAULT_PASSWORD)
    } catch {
      return null
    }
  }

  private async migrateLegacyCredentials(
    Stronghold: any,
    legacyStronghold: any,
    primaryVaultPath: string,
    primaryPassword: string,
  ): Promise<void> {
    try {
      const legacyClient = await this.loadOrCreateClient(legacyStronghold)
      const legacyStore = legacyClient.getStore()

      const primaryStronghold = await Stronghold.load(primaryVaultPath, primaryPassword)
      const primaryClient = await this.loadOrCreateClient(primaryStronghold)
      const primaryStore = primaryClient.getStore()

      for (const key of MIGRATION_KEYS) {
        const value = await legacyStore.get(key)
        if (value) {
          await primaryStore.insert(key, value)
        }
      }

      await primaryStronghold.save()
      notify('info', '認証情報ストレージを新方式へ移行しました。')
    } catch {
      notify('error', '認証情報移行に失敗しました。再認証を行ってください。')
      throw new SecureStorageRecoveryError()
    }
  }

  private async loadOrCreateClient(stronghold: any): Promise<any> {
    try {
      return await stronghold.loadClient(CLIENT_NAME)
    } catch {
      return stronghold.createClient(CLIENT_NAME)
    }
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
