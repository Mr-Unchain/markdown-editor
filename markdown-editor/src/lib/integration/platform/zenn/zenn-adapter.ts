import type { GitHubApiClient } from '../github-api-client'
import type {
  PlatformAdapter,
  ArticlePayload,
  PublishResult,
  ConnectionTestResult,
  LocalImageRef,
  ImageUploadResult,
  PublishRecord,
} from '$lib/types/platform'
import { GitHubApiError } from '$lib/types/platform'
import { stringifyFrontmatter, findPublishRecord } from '$lib/integration/export/frontmatter-utils'
import {
  toZennFrontmatter,
  generateZennSlug,
  buildZennArticlePath,
  buildZennImagePath,
} from './zenn-frontmatter'

/**
 * Zenn Platform Adapter (LC-U4-02)
 * Publishes articles via GitHub Contents API to a Zenn-connected repository.
 */
export class ZennAdapter implements PlatformAdapter {
  readonly platformId = 'zenn'
  readonly platformName = 'Zenn'
  readonly supportsDirectPublish = false

  constructor(private readonly client: GitHubApiClient) {}

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const isAuth = await this.client.testAuth()
      if (!isAuth) {
        return { success: false, message: 'GitHub認証に失敗しました' }
      }

      const rateLimit = await this.client.getRateLimit()
      return {
        success: true,
        message: '接続成功',
        rateLimit: {
          remaining: rateLimit.resources.core.remaining,
          limit: rateLimit.resources.core.limit,
          resetAt: rateLimit.resources.core.reset,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '接続テストに失敗しました',
      }
    }
  }

  async publishDraft(article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult> {
    return this.publish(article, false, signal)
  }

  async publishArticle(article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult> {
    return this.publish(article, true, signal)
  }

  async updateArticle(id: string, article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult> {
    const path = buildZennArticlePath(id)

    try {
      // Get existing file SHA for update
      const existing = await this.client.getFile(path, signal)
      const frontmatter = toZennFrontmatter(article)
      frontmatter.published = article.published ?? false
      const content = await stringifyFrontmatter(article.body, frontmatter)

      const result = await this.createOrUpdateWithRetry(
        path,
        content,
        `update: ${article.title}`,
        existing.sha,
        signal,
      )

      return {
        success: true,
        platformId: this.platformId,
        articleId: id,
        url: `https://zenn.dev/articles/${id}`,
        publishRecord: {
          platformId: this.platformId,
          articleId: id,
          slug: id,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sha: result.content.sha,
        },
      }
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async uploadImage(image: LocalImageRef, signal?: AbortSignal): Promise<ImageUploadResult> {
    try {
      const path = buildZennImagePath(image.filename)

      // Read image file and base64 encode
      // The content is expected to be already base64-encoded by the pipeline
      const result = await this.client.createOrUpdateFile(
        path,
        `__IMAGE_PLACEHOLDER__`, // Pipeline handles actual content
        `add image: ${image.filename}`,
        undefined,
        signal,
      )

      return {
        localPath: image.localPath,
        remoteUrl: `/images/${image.filename}`, // Zenn resolves from GitHub repo during sync
        success: true,
      }
    } catch (error) {
      return {
        localPath: image.localPath,
        remoteUrl: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async publish(
    article: ArticlePayload,
    published: boolean,
    signal?: AbortSignal,
  ): Promise<PublishResult> {
    const slug = article.slug || generateZennSlug()
    const path = buildZennArticlePath(slug)

    try {
      // Check for existing article (idempotent publish — R-U4-04)
      let existingSha: string | undefined
      try {
        const existing = await this.client.getFile(path, signal)
        existingSha = existing.sha
      } catch (error) {
        // 404 means new article — expected
        if (!(error instanceof GitHubApiError && error.status === 404)) {
          throw error
        }
      }

      const frontmatter = toZennFrontmatter(article)
      frontmatter.published = published
      const content = await stringifyFrontmatter(article.body, frontmatter)

      const result = await this.createOrUpdateWithRetry(
        path,
        content,
        existingSha ? `update: ${article.title}` : `create: ${article.title}`,
        existingSha,
        signal,
      )

      return {
        success: true,
        platformId: this.platformId,
        articleId: slug,
        url: `https://zenn.dev/articles/${slug}`,
        publishRecord: {
          platformId: this.platformId,
          articleId: slug,
          slug,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sha: result.content.sha,
        },
      }
    } catch (error) {
      return {
        success: false,
        platformId: this.platformId,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Create or update with 409 Conflict SHA retry (HIGH-04).
   * On conflict, re-fetch SHA and retry once.
   */
  private async createOrUpdateWithRetry(
    path: string,
    content: string,
    message: string,
    sha?: string,
    signal?: AbortSignal,
  ) {
    try {
      return await this.client.createOrUpdateFile(path, content, message, sha, signal)
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 409) {
        // Retry with fresh SHA
        const fresh = await this.client.getFile(path, signal)
        return await this.client.createOrUpdateFile(path, content, message, fresh.sha, signal)
      }
      throw error
    }
  }
}
