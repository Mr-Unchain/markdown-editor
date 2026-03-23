import type { PlatformAdapter } from '$lib/types/platform'

/**
 * Platform Adapter Registry (LC-U4-03, M-U4-01)
 * Manages platform adapters with dynamic registration for extensibility.
 */
export class PlatformAdapterRegistry {
  private adapters = new Map<string, PlatformAdapter>()

  /** Register a platform adapter */
  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platformId, adapter)
  }

  /** Unregister a platform adapter */
  unregister(platformId: string): void {
    this.adapters.delete(platformId)
  }

  /** Get adapter by platform ID */
  get(platformId: string): PlatformAdapter | undefined {
    return this.adapters.get(platformId)
  }

  /** Get all registered adapters */
  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values())
  }

  /** Get all registered platform IDs */
  getPlatformIds(): string[] {
    return Array.from(this.adapters.keys())
  }

  /** Check if a platform is registered */
  has(platformId: string): boolean {
    return this.adapters.has(platformId)
  }
}
