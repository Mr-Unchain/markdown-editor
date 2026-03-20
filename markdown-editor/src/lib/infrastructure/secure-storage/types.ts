export interface SecureStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  has(key: string): Promise<boolean>
}
