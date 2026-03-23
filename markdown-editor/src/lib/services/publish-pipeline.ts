import type {
  PlatformAdapter,
  ArticlePayload,
  PublishResult,
  PublishProgress,
  PublishStep,
  ImageUploadResult,
  ProgressCallback,
} from '$lib/types/platform'
import { PublishCancelledError, PublishError } from '$lib/types/platform'
import { ImageManager } from '$lib/core/image-manager/image-manager'
import { ExportService } from '$lib/integration/export/export-service'
import { upsertPublishRecord } from '$lib/integration/export/frontmatter-utils'
import type { FileSystemAdapter } from '$lib/infrastructure/filesystem/types'

const PIPELINE_TIMEOUT_MS = 300_000 // NFR-U4-20: 300 seconds
const MAX_REQUESTS_PER_PUBLISH = 30 // NFR-U4-18
const IMAGE_WARNING_THRESHOLD = 14 // NFR-U4-18: warn when images > 14

/**
 * Publish Pipeline (LC-U4-06, P-U4-01)
 * Executes the 7-step publish flow with progress callbacks and cancellation support.
 */
export class PublishPipeline {
  private abortController: AbortController | null = null
  private progress: PublishProgress = this.createInitialProgress()
  private onProgress: ProgressCallback = () => {}
  private requestCount = 0

  constructor(
    private readonly imageManager: ImageManager,
    private readonly exportService: ExportService,
    private readonly fs: FileSystemAdapter,
  ) {}

  /**
   * Execute the full publish pipeline.
   */
  async execute(
    payload: ArticlePayload,
    adapter: PlatformAdapter,
    onProgress: ProgressCallback,
    filePath?: string,
  ): Promise<PublishResult> {
    this.onProgress = onProgress
    this.abortController = new AbortController()
    this.requestCount = 0
    this.progress = this.createInitialProgress()
    const signal = this.abortController.signal

    // Pipeline-wide timeout (NFR-U4-20)
    const timeoutId = setTimeout(() => this.abortController?.abort('timeout'), PIPELINE_TIMEOUT_MS)

    // Warn about image count (NFR-U4-18)
    if (payload.images.length > IMAGE_WARNING_THRESHOLD) {
      console.warn(
        `[PublishPipeline] ${payload.images.length} images will require many API calls. ` +
          `Budget: ${MAX_REQUESTS_PER_PUBLISH} requests.`,
      )
    }

    try {
      // Step 1: Validate
      await this.step('validate', async () => {
        this.validatePayload(payload)
      }, signal)

      // Step 2: Export
      const exportResult = await this.step('export', async () => {
        return this.exportService.toMarkdown(payload.body)
      }, signal)

      // Step 3: Upload images
      const uploadResults = await this.step('upload-images', async () => {
        return this.uploadImages(payload, adapter, signal)
      }, signal)

      // Step 4: Replace URLs
      const finalBody = await this.step('replace-urls', async () => {
        return this.replaceImageUrls(exportResult, uploadResults)
      }, signal)

      // Step 5: Publish
      const result = await this.step('publish', async () => {
        this.requestCount++
        this.checkRequestBudget()
        const publishPayload = { ...payload, body: finalBody }
        return adapter.publishDraft(publishPayload, signal)
      }, signal)

      // Step 6: Update frontmatter
      await this.step('update-frontmatter', async () => {
        if (filePath && result.publishRecord) {
          const content = await this.fs.readFile(filePath)
          const updated = await upsertPublishRecord(content, result.publishRecord)
          await this.fs.writeFile(filePath, updated)
        }
      }, signal)

      // Step 7: Complete
      this.updateProgress('complete')
      return result
    } catch (error) {
      if (error instanceof PublishCancelledError) {
        this.progress = { ...this.progress, status: 'cancelled' }
        this.onProgress(this.progress)
        throw error
      }
      this.progress = { ...this.progress, status: 'failed' }
      this.onProgress(this.progress)
      throw error
    } finally {
      clearTimeout(timeoutId)
      this.abortController = null
    }
  }

  /**
   * Cancel the running pipeline.
   */
  cancel(): void {
    this.abortController?.abort('user-cancelled')
  }

  /** Check if pipeline is currently running */
  get isRunning(): boolean {
    return this.abortController !== null
  }

  private async step<T>(name: PublishStep, fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) throw new PublishCancelledError()
    this.updateProgress(name)
    try {
      return await fn()
    } catch (error) {
      if (signal.aborted) throw new PublishCancelledError()
      if (error instanceof PublishCancelledError) throw error
      throw new PublishError(
        error instanceof Error ? error.message : String(error),
        name,
        name !== 'validate', // validate errors are not retryable
        error instanceof Error ? error.message : undefined,
      )
    }
  }

  private updateProgress(step: PublishStep): void {
    const completedSteps = step === 'complete'
      ? 7
      : ['validate', 'export', 'upload-images', 'replace-urls', 'publish', 'update-frontmatter'].indexOf(step)

    this.progress = {
      status: step === 'complete' ? 'completed' : 'running',
      currentStep: step,
      completedSteps,
      totalSteps: 7,
      imageProgress: this.progress.imageProgress,
    }
    this.onProgress(this.progress)
  }

  private async uploadImages(
    payload: ArticlePayload,
    adapter: PlatformAdapter,
    signal: AbortSignal,
  ): Promise<ImageUploadResult[]> {
    if (payload.images.length === 0) return []

    return this.imageManager.uploadForPlatform(
      payload.images,
      adapter,
      signal,
      (completed, total, currentFile) => {
        this.requestCount++
        this.checkRequestBudget()
        this.progress = {
          ...this.progress,
          imageProgress: {
            total,
            completed,
            currentFile,
            failedFiles: [],
          },
        }
        this.onProgress(this.progress)
      },
    )
  }

  private replaceImageUrls(body: string, uploadResults: ImageUploadResult[]): string {
    let result = body
    for (const upload of uploadResults) {
      if (upload.success && upload.remoteUrl) {
        // Replace local path references with remote URLs
        result = result.replaceAll(upload.localPath, upload.remoteUrl)
      }
    }
    return result
  }

  private validatePayload(payload: ArticlePayload): void {
    if (!payload.title?.trim()) {
      throw new Error('タイトルは必須です')
    }
    if (!payload.body?.trim()) {
      throw new Error('本文は必須です')
    }
  }

  private checkRequestBudget(): void {
    if (this.requestCount > MAX_REQUESTS_PER_PUBLISH) {
      throw new PublishError(
        `APIリクエスト数が上限（${MAX_REQUESTS_PER_PUBLISH}）を超えました`,
        'upload-images',
        false,
      )
    }
  }

  private createInitialProgress(): PublishProgress {
    return {
      status: 'idle',
      currentStep: 'validate',
      completedSteps: 0,
      totalSteps: 7,
    }
  }
}
