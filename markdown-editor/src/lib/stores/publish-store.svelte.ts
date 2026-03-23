import type { PublishProgress, PublishResult, ArticlePayload } from '$lib/types/platform'
import type { PublishService } from '$lib/services/publish'

let progress = $state<PublishProgress>({
  status: 'idle',
  currentStep: 'validate',
  completedSteps: 0,
  totalSteps: 7,
})

let lastResult = $state<PublishResult | null>(null)
let lastError = $state<string | null>(null)

let publishService: PublishService | null = null

/** Initialize publish store with service instance */
export function initPublishStore(service: PublishService): void {
  publishService = service
}

/** Get current publish progress (reactive) */
export function getPublishProgress(): PublishProgress {
  return progress
}

/** Get last publish result */
export function getLastResult(): PublishResult | null {
  return lastResult
}

/** Get last error message */
export function getLastError(): string | null {
  return lastError
}

/** Check if publishing is in progress */
export function isPublishing(): boolean {
  return progress.status === 'running'
}

/**
 * Start publishing an article.
 */
export async function startPublish(
  platformId: string,
  payload: ArticlePayload,
  filePath?: string,
): Promise<PublishResult> {
  if (!publishService) throw new Error('PublishService not initialized')

  lastError = null
  lastResult = null

  try {
    const result = await publishService.publish(
      platformId,
      payload,
      (p) => {
        progress = { ...p }
      },
      filePath,
    )
    lastResult = result
    return result
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    throw error
  }
}

/** Cancel the current publish operation */
export function cancelPublish(): void {
  publishService?.cancel()
  progress = { ...progress, status: 'idle' }
}

/** Reset publish state */
export function resetPublishState(): void {
  progress = {
    status: 'idle',
    currentStep: 'validate',
    completedSteps: 0,
    totalSteps: 7,
  }
  lastResult = null
  lastError = null
}
