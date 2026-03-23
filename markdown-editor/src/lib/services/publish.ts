import type {
  PlatformAdapter,
  ArticlePayload,
  PublishResult,
  ProgressCallback,
} from '$lib/types/platform'
import type { PlatformAdapterRegistry } from '$lib/integration/platform/platform-adapter-registry'
import type { ExportService } from '$lib/integration/export/export-service'
import type { ImageManager } from '$lib/core/image-manager/image-manager'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'
import { PublishPipeline } from './publish-pipeline'
import { CredentialManager } from './credential-manager'
import type { SettingsManager } from '$lib/core/settings/settings-manager.svelte'
import { ZennAdapter } from '$lib/integration/platform/zenn/zenn-adapter'
import { GitHubApiClientImpl } from '$lib/integration/platform/github-api-client'
import type { ZennCredentials } from '$lib/types/settings'

/**
 * Publish Guard (LC-U4-13, R-U4-04)
 * Prevents concurrent publish operations.
 */
class PublishGuard {
  private _isPublishing = false

  get isPublishing(): boolean {
    return this._isPublishing
  }

  async withGuard<T>(fn: () => Promise<T>): Promise<T> {
    if (this._isPublishing) {
      throw new Error('投稿処理が進行中です')
    }
    this._isPublishing = true
    try {
      return await fn()
    } finally {
      this._isPublishing = false
    }
  }
}

/**
 * Publish Service (LC-U4-07)
 * Orchestrates the publish pipeline with credential management.
 */
export class PublishService {
  private readonly pipeline: PublishPipeline
  private readonly credentialManager: CredentialManager
  private readonly guard = new PublishGuard()

  constructor(
    private readonly registry: PlatformAdapterRegistry,
    private readonly exportService: ExportService,
    private readonly imageManager: ImageManager,
    private readonly settingsManager: SettingsManager,
    private readonly fs: FileSystemAdapter,
  ) {
    this.pipeline = new PublishPipeline(imageManager, exportService, fs)
    this.credentialManager = new CredentialManager(settingsManager)
  }

  /**
   * Publish an article to a platform.
   * Uses on-demand credentials (S-U4-01) and publish guard (R-U4-04).
   */
  async publish(
    platformId: string,
    payload: ArticlePayload,
    onProgress: ProgressCallback,
    filePath?: string,
  ): Promise<PublishResult> {
    return this.guard.withGuard(async () => {
      // On-demand credential retrieval
      return this.credentialManager.withCredentials(platformId, async (creds) => {
        const adapter = this.createAdapter(platformId, creds)
        return this.pipeline.execute(payload, adapter, onProgress, filePath)
      })
    })
  }

  /**
   * Cancel the current publish operation.
   */
  cancel(): void {
    this.pipeline.cancel()
  }

  /**
   * Check if a publish is currently in progress.
   */
  get isPublishing(): boolean {
    return this.guard.isPublishing
  }

  /**
   * Test platform connection with on-demand credentials.
   */
  async testConnection(platformId: string) {
    return this.credentialManager.withCredentials(platformId, async (creds) => {
      const adapter = this.createAdapter(platformId, creds)
      return adapter.testConnection()
    })
  }

  /**
   * Get the ExportService for direct export operations.
   */
  getExportService(): ExportService {
    return this.exportService
  }

  /**
   * Create a platform adapter with credentials.
   */
  private createAdapter(platformId: string, credentials: unknown): PlatformAdapter {
    switch (platformId) {
      case 'zenn': {
        const creds = credentials as ZennCredentials
        const client = new GitHubApiClientImpl(
          creds.githubToken,
          creds.repositoryOwner,
          creds.repositoryName,
          creds.branch,
        )
        return new ZennAdapter(client)
      }
      default:
        throw new Error(`未対応のプラットフォーム: ${platformId}`)
    }
  }
}
