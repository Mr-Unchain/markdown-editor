// U4 Platform Integration types

// Re-export existing credentials from settings.ts
export type { PlatformCredentials, ZennCredentials } from './settings'

/** Publish step identifiers for the 7-step pipeline */
export type PublishStep =
  | 'validate'
  | 'export'
  | 'upload-images'
  | 'replace-urls'
  | 'publish'
  | 'update-frontmatter'
  | 'complete'

/** Image upload progress within a pipeline step */
export interface ImageProgress {
  total: number
  completed: number
  currentFile: string
  failedFiles: string[]
}

/** Overall publish progress */
export interface PublishProgress {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  currentStep: PublishStep
  completedSteps: number
  totalSteps: number
  imageProgress?: ImageProgress
}

/** Local image reference for upload */
export interface LocalImageRef {
  localPath: string
  filename: string
  mimeType: string
  size: number
}

/** Result of uploading a single image */
export interface ImageUploadResult {
  localPath: string
  remoteUrl: string
  success: boolean
  error?: string
}

/** Image asset metadata */
export interface ImageAsset {
  localPath: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

/** Article payload for publishing */
export interface ArticlePayload {
  title: string
  body: string
  bodyFormat: 'markdown' | 'html'
  tags?: string[]
  category?: string
  images: LocalImageRef[]
  // Zenn-specific fields
  slug?: string
  emoji?: string
  articleType?: 'tech' | 'idea'
  published?: boolean
}

/** Result of a publish operation */
export interface PublishResult {
  success: boolean
  platformId: string
  articleId?: string
  url?: string
  error?: string
  publishRecord?: PublishRecord
}

/** Record stored in frontmatter to track published articles */
export interface PublishRecord {
  platformId: string
  articleId: string
  slug: string
  publishedAt: string
  updatedAt: string
  sha?: string
}

/** Connection test result */
export interface ConnectionTestResult {
  success: boolean
  message?: string
  rateLimit?: {
    remaining: number
    limit: number
    resetAt: number
  }
}

/** Platform adapter interface */
export interface PlatformAdapter {
  readonly platformId: string
  readonly platformName: string
  readonly supportsDirectPublish: boolean

  testConnection(): Promise<ConnectionTestResult>
  publishDraft(article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult>
  publishArticle(article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult>
  updateArticle(id: string, article: ArticlePayload, signal?: AbortSignal): Promise<PublishResult>
  uploadImage(image: LocalImageRef, signal?: AbortSignal): Promise<ImageUploadResult>
}

/** GitHub API response types */
export interface GitHubFileResponse {
  path: string
  content: string
  sha: string
  encoding?: string
}

export interface GitHubCommitResponse {
  content: {
    path: string
    sha: string
  }
  commit: {
    message: string
    sha: string
  }
}

export interface GitHubRateLimitResponse {
  resources: {
    core: {
      limit: number
      remaining: number
      reset: number
    }
  }
}

/** Publish error with step context */
export class PublishError extends Error {
  constructor(
    message: string,
    public readonly step: PublishStep,
    public readonly retryable: boolean,
    public readonly details?: string,
  ) {
    super(message)
    this.name = 'PublishError'
  }
}

/** Cancel error */
export class PublishCancelledError extends Error {
  constructor() {
    super('投稿がキャンセルされました')
    this.name = 'PublishCancelledError'
  }
}

/** GitHub API error */
export class GitHubApiError extends Error {
  public readonly status: number
  public readonly statusText: string
  public readonly endpoint: string
  public readonly retryAfter?: number
  public readonly rateLimitReset?: number

  constructor(response: { status: number; statusText: string }, endpoint: string) {
    super(`GitHub API error: ${response.status} ${response.statusText} for ${endpoint}`)
    this.name = 'GitHubApiError'
    this.status = response.status
    this.statusText = response.statusText
    this.endpoint = endpoint
  }
}

/** Security error for HTTPS violations */
export class SecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityError'
  }
}

/** Progress callback type (injected from store layer) */
export type ProgressCallback = (progress: PublishProgress) => void
