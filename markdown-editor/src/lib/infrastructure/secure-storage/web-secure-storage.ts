import type { SecureStorage } from './types'

const STORAGE_PREFIX = 'markdown-editor-secure:'

export class WebSecureStorage implements SecureStorage {
  private warningShown = false

  private showSecurityWarning(): void {
    if (this.warningShown) return
    this.warningShown = true
    console.warn(
      '[SecureStorage] Web版ではAPIキーがブラウザのlocalStorageに保存されます。' +
        '共有端末での利用にはご注意ください。',
    )
  }

  async get(key: string): Promise<string | null> {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!stored) return null
    try {
      return atob(stored)
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    this.showSecurityWarning()
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, btoa(value))
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) !== null
  }
}
