import type {
  ArticlePayload,
  ConnectionTestResult,
  ImageUploadResult,
  LocalImageRef,
  PlatformAdapter,
  PublishResult,
} from '$lib/types/platform'

/**
 * Export-only adapter placeholder for platforms not yet supporting API publish.
 */
export class ExportOnlyAdapter implements PlatformAdapter {
  readonly supportsDirectPublish = false
  readonly capabilities = ['export-only'] as const

  constructor(
    public readonly platformId: string,
    public readonly platformName: string,
  ) {}

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: false,
      message: `${this.platformName} は現在エクスポートのみ対応です`,
    }
  }

  async publishDraft(_article: ArticlePayload): Promise<PublishResult> {
    return this.unsupportedResult()
  }

  async publishArticle(_article: ArticlePayload): Promise<PublishResult> {
    return this.unsupportedResult()
  }

  async updateArticle(_id: string, _article: ArticlePayload): Promise<PublishResult> {
    return this.unsupportedResult()
  }

  async uploadImage(image: LocalImageRef): Promise<ImageUploadResult> {
    return {
      localPath: image.localPath,
      remoteUrl: '',
      success: false,
      error: `${this.platformName} は現在エクスポートのみ対応です`,
    }
  }

  private unsupportedResult(): PublishResult {
    return {
      success: false,
      platformId: this.platformId,
      error: `${this.platformName} は現在エクスポートのみ対応です`,
    }
  }
}
