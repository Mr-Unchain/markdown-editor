import type { PlatformAdapterFactory } from '$lib/types/platform'

/**
 * Platform Adapter Registry (LC-U4-03, M-U4-01)
 * Manages platform adapters with dynamic registration for extensibility.
 */
export class PlatformAdapterRegistry {
  private adapters = new Map<string, PlatformAdapterFactory>()

  /** Register a platform adapter factory */
  register(adapterFactory: PlatformAdapterFactory): void {
    this.adapters.set(adapterFactory.platformId, adapterFactory)
  }

  /** Unregister a platform adapter */
  unregister(platformId: string): void {
    this.adapters.delete(platformId)
  }

  /** Get adapter by platform ID */
  get(platformId: string): PlatformAdapterFactory | undefined {
    return this.adapters.get(platformId)
  }

  /** Get all registered adapter factories */
  getAll(): PlatformAdapterFactory[] {
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
