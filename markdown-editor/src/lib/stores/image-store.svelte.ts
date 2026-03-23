import type { ImageManager, ImageInsertResult } from '$lib/core/image-manager/image-manager'

let imageManager: ImageManager | null = null
let isProcessing = $state<boolean>(false)
let lastError = $state<string | null>(null)

/** Initialize image store with ImageManager instance */
export function initImageStore(manager: ImageManager): void {
  imageManager = manager
}

/** Get processing state (reactive) */
export function getIsProcessing(): boolean {
  return isProcessing
}

/** Get last error */
export function getImageError(): string | null {
  return lastError
}

/**
 * Handle image drop event.
 * Returns markdown image references for insertion into editor.
 */
export async function handleImageDrop(
  event: DragEvent,
  markdownFilePath: string,
): Promise<ImageInsertResult[]> {
  if (!imageManager) throw new Error('ImageManager not initialized')

  isProcessing = true
  lastError = null

  try {
    return await imageManager.handleDrop(event, markdownFilePath)
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    return [{ success: false, error: lastError }]
  } finally {
    isProcessing = false
  }
}

/**
 * Handle image paste event.
 */
export async function handleImagePaste(
  event: ClipboardEvent,
  markdownFilePath: string,
): Promise<ImageInsertResult | null> {
  if (!imageManager) throw new Error('ImageManager not initialized')

  isProcessing = true
  lastError = null

  try {
    return await imageManager.handlePaste(event, markdownFilePath)
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    return { success: false, error: lastError }
  } finally {
    isProcessing = false
  }
}

/**
 * Insert image from file dialog (/image slash command — US-17).
 */
export async function insertFromSlashCommand(
  file: File,
  markdownFilePath: string,
): Promise<ImageInsertResult> {
  if (!imageManager) throw new Error('ImageManager not initialized')

  isProcessing = true
  lastError = null

  try {
    return await imageManager.insertFromFile(file, markdownFilePath)
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    return { success: false, error: lastError }
  } finally {
    isProcessing = false
  }
}

/** Clear error state */
export function clearImageError(): void {
  lastError = null
}
